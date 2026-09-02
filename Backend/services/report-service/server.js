const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createPool } = require("../../shared/database");
const { authenticate, authorize, asyncHandler, errorHandler } = require("../../shared/auth");

const app = express();
const pool = createPool();
const PORT = Number(process.env.PORT || 5006);
const MAX_SUMMARY_BYTES = 200000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const manager = (role) => ["ADMIN", "HR"].includes(role);
const isPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
};
const serviceUrls = {
  internship: process.env.INTERNSHIP_SERVICE_URL || "http://localhost:5002",
  task: process.env.TASK_SERVICE_URL || "http://localhost:5003",
  sentiment: process.env.SENTIMENT_SERVICE_URL || "http://localhost:5004",
  evaluation: process.env.EVALUATION_SERVICE_URL || "http://localhost:5005",
};

function normalizeMonth(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^([0-9]{4})-([0-9]{2})(?:-([0-9]{2}))?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] || 1);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return year + "-" + String(month).padStart(2, "0") + "-01";
}

function rowBelongsToMonth(row, month) {
  const dateValue = row.update_date || row.evaluation_date || row.created_at || row.due_date;
  return !dateValue || String(dateValue).slice(0, 7) === month.slice(0, 7);
}

function records(payload, key) {
  if (Array.isArray(payload?.[key])) return payload[key];
  return Array.isArray(payload) ? payload : [];
}

function average(rows, field) {
  const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
  return values.length
    ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(2))
    : 0;
}

async function ensureSchema() {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS monthly_reports (" +
      "report_id SERIAL PRIMARY KEY, " +
      "intern_id INTEGER NOT NULL, " +
      "internship_id INTEGER NOT NULL, " +
      "month DATE NOT NULL, " +
      "generated_by INTEGER NOT NULL, " +
      "summary JSONB NOT NULL, " +
      "created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP"
      + ")",
  );
  await pool.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS monthly_reports_internship_month_idx " +
      "ON monthly_reports (intern_id, internship_id, month)",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS monthly_reports_month_idx ON monthly_reports (month DESC)",
  );
}

async function serviceGet(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) {
    const error = new Error("Upstream service returned " + response.status);
    error.statusCode = 502;
    throw error;
  }
  return response.json();
}

async function generateReport(req, internId, internshipId, month) {
  const authorization = req.headers.authorization || "";
  const token = authorization.split(" ")[1];
  const role = req.user.role;
  const taskPath = role === "INTERN"
    ? "/api/tasks/mine"
    : "/api/tasks";
  const evaluationPath = role === "INTERN"
    ? "/api/evaluations/mine"
    : "/api/evaluations";
  const sentimentRequest = role === "INTERN"
    ? serviceGet(serviceUrls.sentiment + "/api/sentiment/mine", token)
    : serviceGet(serviceUrls.sentiment + "/api/sentiment", token);

  const [internshipPayload, taskPayload, sentimentPayload, evaluationPayload] = await Promise.all([
    serviceGet(serviceUrls.internship + "/api/internships/" + internshipId, token),
    serviceGet(serviceUrls.task + taskPath, token),
    sentimentRequest,
    serviceGet(serviceUrls.evaluation + evaluationPath, token),
  ]);

  const monthKey = month.slice(0, 7);
  const tasks = records(taskPayload, "tasks").filter(
    (item) => Number(item.internship_id) === Number(internshipId) && rowBelongsToMonth(item, month),
  );
  const sentiments = records(sentimentPayload, "analyses").filter(
    (item) => Number(item.intern_id) === Number(internId) && rowBelongsToMonth(item, month),
  );
  const evaluations = records(evaluationPayload, "evaluations").filter(
    (item) => Number(item.internship_id) === Number(internshipId) && rowBelongsToMonth(item, month),
  );
  const completed = tasks.filter((item) => String(item.status).toUpperCase() === "COMPLETED").length;
  const summary = {
    month: monthKey,
    tasks_assigned: tasks.length,
    tasks_completed: completed,
    completion_percentage: tasks.length ? Number(((completed / tasks.length) * 100).toFixed(2)) : 0,
    sentiment_entries: sentiments.length,
    average_sentiment: average(sentiments, "score"),
    evaluations_count: evaluations.length,
    average_mentor_rating: average(evaluations, "overall_score"),
    work_quality: average(evaluations, "work_quality"),
    technical_skills: average(evaluations, "technical_skills"),
    communication: average(evaluations, "communication"),
    punctuality: average(evaluations, "punctuality"),
    problem_solving: average(evaluations, "problem_solving"),
    overall_score: average(evaluations, "overall_score"),
    mentor_feedback: evaluations.map((item) => item.comments).filter(Boolean),
    generated_from: {
      internship: internshipPayload.internship || internshipPayload,
      tasks: tasks.length,
      sentiment_entries: sentiments.length,
      evaluations: evaluations.length,
    },
  };

  const result = await pool.query(
    "INSERT INTO monthly_reports (intern_id, internship_id, month, generated_by, summary) " +
      "VALUES ($1,$2,$3,$4,$5) " +
      "ON CONFLICT (intern_id, internship_id, month) DO UPDATE SET " +
      "summary = EXCLUDED.summary, generated_by = EXCLUDED.generated_by, created_at = CURRENT_TIMESTAMP " +
      "RETURNING *",
    [internId, internshipId, month, req.user.user_id, summary],
  );
  return result.rows[0];
}

app.get("/", (req, res) =>
  res.json({ service: "report-service", message: "Report Service API is running" }),
);

app.get("/health", asyncHandler(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ status: "ok", service: "report-service" });
}));

const router = express.Router();
router.use(authenticate);

router.post(
  "/generate",
  authorize("INTERN", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const internId = Number(req.body.intern_id);
    const internshipId = Number(req.body.internship_id);
    const month = normalizeMonth(req.body.month);
    if (!isPositiveInteger(internId) || !isPositiveInteger(internshipId) || !month) {
      return res.status(400).json({
        message: "intern_id and internship_id must be positive integers; month must be a valid YYYY-MM or YYYY-MM-DD",
      });
    }
    if (!manager(req.user.role) && internId !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "You can only generate your own report" });
    }
    const report = await generateReport(req, internId, internshipId, month);
    res.status(201).json({ message: "Monthly report generated successfully", report });
  }),
);

router.post(
  "/monthly",
  authorize("INTERN", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const internId = Number(req.body.intern_id);
    const internshipId = Number(req.body.internship_id);
    const month = normalizeMonth(req.body.month);
    const summary = req.body.summary;
    if (
      !isPositiveInteger(internId) ||
      !isPositiveInteger(internshipId) ||
      !month ||
      !summary ||
      typeof summary !== "object" ||
      Array.isArray(summary)
    ) {
      return res.status(400).json({
        message: "intern_id, internship_id, valid month and an object summary are required",
      });
    }
    if (Buffer.byteLength(JSON.stringify(summary), "utf8") > MAX_SUMMARY_BYTES) {
      return res.status(400).json({ message: "summary is too large" });
    }
    if (!manager(req.user.role) && internId !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "You can only save your own report" });
    }
    const result = await pool.query(
      "INSERT INTO monthly_reports (intern_id, internship_id, month, generated_by, summary) " +
        "VALUES ($1,$2,$3,$4,$5) " +
        "ON CONFLICT (intern_id, internship_id, month) DO UPDATE SET " +
        "summary = EXCLUDED.summary, generated_by = EXCLUDED.generated_by, created_at = CURRENT_TIMESTAMP " +
        "RETURNING *",
      [internId, internshipId, month, req.user.user_id, summary],
    );
    res.status(201).json({ message: "Monthly report saved successfully", report: result.rows[0] });
  }),
);

router.get(
  "/mine",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM monthly_reports WHERE intern_id = $1 ORDER BY month DESC, report_id DESC",
      [req.user.user_id],
    );
    res.json({ reports: result.rows });
  }),
);

router.get(
  "/",
  authorize("ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM monthly_reports ORDER BY month DESC, report_id DESC",
    );
    res.json({ reports: result.rows });
  }),
);

router.get(
  "/:id",
  authorize("INTERN", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    if (!isPositiveInteger(req.params.id)) {
      return res.status(400).json({ message: "report id must be a positive integer" });
    }
    const result = await pool.query(
      "SELECT * FROM monthly_reports WHERE report_id = $1",
      [req.params.id],
    );
    const report = result.rows[0];
    if (!report) return res.status(404).json({ message: "Report not found" });
    if (!manager(req.user.role) && Number(report.intern_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "You do not have access to this report" });
    }
    res.json({ report });
  }),
);

app.use("/api/reports", router);
app.use((error, req, res, next) => {
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  return errorHandler(error, req, res, next);
});

ensureSchema()
  .then(() => {
    const server = app.listen(PORT, () => console.log("Report Service running on port " + PORT));
    const shutdown = () => server.close(() => pool.end(() => process.exit(0)));
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  })
  .catch((error) => {
    console.error("Report schema initialization failed:", error.message);
    process.exit(1);
  });
