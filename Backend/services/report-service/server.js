const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createPool } = require("../../shared/database");
const { authenticate, authorize, asyncHandler, errorHandler } = require("../../shared/auth");

const app = express();
const pool = createPool();
app.use(cors());
app.use(express.json());
const manager = (role) => ["ADMIN", "HR"].includes(role);
const serviceUrls = {
  internship: process.env.INTERNSHIP_SERVICE_URL || "http://localhost:5002",
  task: process.env.TASK_SERVICE_URL || "http://localhost:5003",
  sentiment: process.env.SENTIMENT_SERVICE_URL || "http://localhost:5004",
  evaluation: process.env.EVALUATION_SERVICE_URL || "http://localhost:5005",
};

async function ensureSchema() {
  await pool.query("ALTER TABLE monthly_reports ADD COLUMN IF NOT EXISTS month DATE, ADD COLUMN IF NOT EXISTS generated_by INTEGER, ADD COLUMN IF NOT EXISTS summary JSONB, ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS monthly_reports_internship_month_idx ON monthly_reports (intern_id, internship_id, month)");
}

app.get("/", (req, res) => res.json({ message: "Report Service API is running" }));
app.get("/health", asyncHandler(async (req, res) => { await pool.query("SELECT 1"); res.json({ status: "ok" }); }));
const router = express.Router();
router.use(authenticate);

const records = (payload, key) => Array.isArray(payload?.[key]) ? payload[key] : (Array.isArray(payload) ? payload : []);
const average = (rows, field) => {
  const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
  return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0;
};
async function serviceGet(url, token) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Upstream service returned ${response.status}: ${url}`);
  return response.json();
}

async function generateReport(req, internId, internshipId, month) {
  const token = req.headers.authorization.split(" ")[1];
  const role = req.user.role;
  const taskPath = role === "INTERN" ? "/api/tasks/mine" : role === "MENTOR" ? "/api/tasks/assigned" : "/api/tasks";
  const evaluationPath = role === "INTERN" ? "/api/evaluations/mine" : role === "MENTOR" ? "/api/evaluations/assigned" : "/api/evaluations";
  const sentimentRequest = role === "MENTOR" ? Promise.resolve({ analyses: [] }) : serviceGet(`${serviceUrls.sentiment}${role === "INTERN" ? "/api/sentiment/mine" : "/api/sentiment"}`, token);
  const [internshipPayload, taskPayload, sentimentPayload, evaluationPayload] = await Promise.all([
    serviceGet(`${serviceUrls.internship}/api/internships/${internshipId}`, token),
    serviceGet(`${serviceUrls.task}${taskPath}`, token),
    sentimentRequest,
    serviceGet(`${serviceUrls.evaluation}${evaluationPath}`, token),
  ]);
  const tasks = records(taskPayload, "tasks").filter((x) => !x.internship_id || Number(x.internship_id) === Number(internshipId));
  const sentiments = records(sentimentPayload, "analyses").filter((x) => !x.intern_id || Number(x.intern_id) === Number(internId));
  const evaluations = records(evaluationPayload, "evaluations").filter((x) => !x.internship_id || Number(x.internship_id) === Number(internshipId));
  const completed = tasks.filter((x) => String(x.status).toUpperCase() === "COMPLETED").length;
  const summary = {
    tasks_assigned: tasks.length, tasks_completed: completed,
    completion_percentage: tasks.length ? Number(((completed / tasks.length) * 100).toFixed(2)) : 0,
    average_sentiment: average(sentiments, "score"), average_mentor_rating: average(evaluations, "overall_score"),
    work_quality: average(evaluations, "work_quality"), technical_skills: average(evaluations, "technical_skills"),
    communication: average(evaluations, "communication"), punctuality: average(evaluations, "punctuality"),
    problem_solving: average(evaluations, "problem_solving"), overall_score: average(evaluations, "overall_score"),
    mentor_feedback: evaluations.map((x) => x.comments).filter(Boolean),
    generated_from: { internship: internshipPayload.internship || internshipPayload, tasks: tasks.length, sentiment_entries: sentiments.length, evaluations: evaluations.length },
  };
  const result = await pool.query(`INSERT INTO monthly_reports (intern_id, internship_id, month, generated_by, summary) VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (intern_id, internship_id, month) DO UPDATE SET summary = EXCLUDED.summary, generated_by = EXCLUDED.generated_by, created_at = CURRENT_TIMESTAMP RETURNING *`,
    [internId, internshipId, month, req.user.user_id, summary]);
  return result.rows[0];
}

router.post("/generate", asyncHandler(async (req, res) => {
  const { intern_id, internship_id, month } = req.body;
  if (!intern_id || !internship_id || !/^\d{4}-\d{2}(-\d{2})?$/.test(String(month || ""))) return res.status(400).json({ message: "intern_id, internship_id and month (YYYY-MM or YYYY-MM-DD) are required" });
  if (!manager(req.user.role) && Number(intern_id) !== Number(req.user.user_id)) return res.status(403).json({ message: "You can only generate your own report" });
  const report = await generateReport(req, intern_id, internship_id, String(month).length === 7 ? `${month}-01` : month);
  res.status(201).json({ message: "Monthly report generated successfully", report });
}));
router.post("/monthly", asyncHandler(async (req, res) => {
  const { intern_id, internship_id, month, summary } = req.body;
  if (!intern_id || !internship_id || !month || !summary || typeof summary !== "object" || Array.isArray(summary)) return res.status(400).json({ message: "intern_id, internship_id, month and an object summary are required" });
  if (!manager(req.user.role) && Number(intern_id) !== req.user.user_id) return res.status(403).json({ message: "You can only save your own report" });
  const result = await pool.query(
    `INSERT INTO monthly_reports (intern_id, internship_id, month, generated_by, summary) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (intern_id, internship_id, month) DO UPDATE SET summary = EXCLUDED.summary, generated_by = EXCLUDED.generated_by, created_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [intern_id, internship_id, month, req.user.user_id, summary],
  );
  res.status(201).json({ message: "Monthly report saved successfully", report: result.rows[0] });
}));
router.get("/mine", authorize("INTERN"), asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM monthly_reports WHERE intern_id = $1 ORDER BY month DESC", [req.user.user_id]);
  res.json({ reports: result.rows });
}));
router.get("/", authorize("ADMIN", "HR"), asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM monthly_reports ORDER BY month DESC, report_id DESC");
  res.json({ reports: result.rows });
}));
router.get("/:id", asyncHandler(async (req, res) => {
  const result = await pool.query("SELECT * FROM monthly_reports WHERE report_id = $1", [req.params.id]);
  const report = result.rows[0];
  if (!report) return res.status(404).json({ message: "Report not found" });
  if (!manager(req.user.role) && report.intern_id !== req.user.user_id) return res.status(403).json({ message: "You do not have access to this report" });
  res.json({ report });
}));
app.use("/api/reports", router);
app.use(errorHandler);
ensureSchema().then(() => app.listen(Number(process.env.PORT || 5006), () => console.log(`Report Service running on port ${process.env.PORT || 5006}`))).catch((error) => { console.error("Report schema initialization failed:", error.message); process.exit(1); });
