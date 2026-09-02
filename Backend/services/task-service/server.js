const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createPool } = require("../../shared/database");
const {
  authenticate,
  authorize,
  asyncHandler,
  errorHandler,
} = require("../../shared/auth");

const app = express();
const pool = createPool();
const PORT = Number(process.env.PORT || 5003);
const SENTIMENT_SERVICE_URL = process.env.SENTIMENT_SERVICE_URL || "http://localhost:5004";

async function requestSentimentAnalysis(req, update) {
  const token = (req.headers.authorization || "").split(" ")[1];
  try {
    const response = await fetch(SENTIMENT_SERVICE_URL + "/api/sentiment/analyze", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) {
      console.error("Sentiment service returned status " + response.status);
      return { status: "failed" };
    }
    return { status: "analyzed", result: await response.json() };
  } catch (error) {
    console.error("Sentiment service unavailable:", error.message);
    return { status: "pending" };
  }
}

const VALID_STATUSES = new Set(["PENDING", "IN_PROGRESS", "COMPLETED"]);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const isProgrammeManager = (role) => ["ADMIN", "HR"].includes(role);
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const toPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};
const isIsoDate = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
const taskAccess = (task, user) =>
  isProgrammeManager(user.role) ||
  Number(task.intern_id) === Number(user.user_id) ||
  Number(task.mentor_id) === Number(user.user_id);

function validateTaskFields(body, { creating = false } = {}) {
  const required = ["internship_id", "intern_id", "mentor_id"];
  if (creating && required.some((field) => !toPositiveInteger(body[field]))) {
    return "internship_id, intern_id and mentor_id must be positive integers";
  }
  if (creating && (typeof body.title !== "string" || !body.title.trim())) {
    return "title is required";
  }
  if (typeof body.title === "string" && (body.title.trim().length === 0 || body.title.trim().length > 180)) {
    return "title must contain 1 to 180 characters";
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    return "description must be a string or null";
  }
  if (typeof body.description === "string" && body.description.length > 10000) {
    return "description must be 10000 characters or fewer";
  }
  if (!isIsoDate(body.due_date)) return "due_date must use YYYY-MM-DD format or be null";
  if (body.status !== undefined && !VALID_STATUSES.has(body.status)) {
    return "status must be PENDING, IN_PROGRESS or COMPLETED";
  }
  return null;
}

app.get("/", (req, res) =>
  res.json({ service: "task-service", message: "Task Service API is running" }),
);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "task-service" });
  } catch (error) {
    console.error("Task health check failed:", error.message);
    res.status(503).json({ status: "error", message: "Database connection failed" });
  }
});

const router = express.Router();
router.use(authenticate);

router.post(
  "/",
  authorize("MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const validationError = validateTaskFields(req.body, { creating: true });
    if (validationError) return res.status(400).json({ message: validationError });

    const internshipId = toPositiveInteger(req.body.internship_id);
    const internId = toPositiveInteger(req.body.intern_id);
    const mentorId = toPositiveInteger(req.body.mentor_id);
    if (req.user.role === "MENTOR" && mentorId !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "Mentors can only create their own tasks" });
    }

    const result = await pool.query(
      "INSERT INTO tasks (internship_id, intern_id, mentor_id, title, description, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        internshipId,
        internId,
        mentorId,
        req.body.title.trim(),
        req.body.description || null,
        req.body.due_date || null,
      ],
    );
    res.status(201).json({ message: "Task created successfully", task: result.rows[0] });
  }),
);

router.get(
  "/mine",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE intern_id = $1 ORDER BY due_date NULLS LAST, task_id DESC",
      [req.user.user_id],
    );
    res.json({ tasks: result.rows });
  }),
);

router.get(
  "/assigned",
  authorize("MENTOR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE mentor_id = $1 ORDER BY due_date NULLS LAST, task_id DESC",
      [req.user.user_id],
    );
    res.json({ tasks: result.rows });
  }),
);

router.get(
  "/",
  authorize("ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM tasks ORDER BY task_id DESC");
    res.json({ tasks: result.rows });
  }),
);


router.post(
  "/updates",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.body.task_id);
    const { reflection, hours_worked: hoursWorked, update_date: updateDate } = req.body;
    if (!taskId) return res.status(400).json({ message: "task_id must be a positive integer" });
    if (typeof reflection !== "string" || !reflection.trim()) {
      return res.status(400).json({ message: "reflection is required" });
    }
    if (reflection.trim().length > 10000) {
      return res.status(400).json({ message: "reflection must be 10000 characters or fewer" });
    }
    const parsedHours = hoursWorked === null || hoursWorked === undefined || hoursWorked === "" ? null : Number(hoursWorked);
    if (parsedHours !== null && (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24)) {
      return res.status(400).json({ message: "hours_worked must be between 0 and 24" });
    }
    if (!isIsoDate(updateDate)) return res.status(400).json({ message: "update_date must use YYYY-MM-DD format or be null" });
    const taskResult = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (Number(task.intern_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }
    const result = await pool.query(
      "INSERT INTO daily_updates (task_id, intern_id, reflection, hours_worked, update_date) VALUES ($1,$2,$3,$4,COALESCE($5,CURRENT_DATE)) RETURNING *",
      [taskId, req.user.user_id, reflection.trim(), parsedHours, updateDate || null],
    );
    const sentiment = await requestSentimentAnalysis(req, {
      update_id: result.rows[0].update_id,
      intern_id: req.user.user_id,
      text: reflection.trim(),
      text_content: reflection.trim(),
    });
    res.status(201).json({ message: "Daily update created successfully", update: result.rows[0], sentiment });
  }),
);

router.get(
  "/updates",
  authorize("INTERN", "MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const values = [];
    let filter = "";
    if (req.user.role === "INTERN") {
      values.push(req.user.user_id);
      filter = " WHERE du.intern_id = $1";
    } else if (req.user.role === "MENTOR") {
      values.push(req.user.user_id);
      filter = " WHERE t.mentor_id = $1";
    }
    const result = await pool.query(
      "SELECT du.*, t.title, t.internship_id, t.mentor_id FROM daily_updates du JOIN tasks t ON t.task_id = du.task_id" + filter + " ORDER BY du.update_date DESC, du.update_id DESC",
      values,
    );
    res.json({ updates: result.rows });
  }),
);

router.get(
  "/updates/:updateId",
  authorize("INTERN", "MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const updateId = toPositiveInteger(req.params.updateId);
    if (!updateId) return res.status(400).json({ message: "update id must be a positive integer" });
    const result = await pool.query(
      "SELECT du.*, t.title, t.internship_id, t.mentor_id FROM daily_updates du JOIN tasks t ON t.task_id = du.task_id WHERE du.update_id = $1",
      [updateId],
    );
    const update = result.rows[0];
    if (!update) return res.status(404).json({ message: "Daily update not found" });
    const allowed = ["ADMIN", "HR"].includes(req.user.role) ||
      Number(update.intern_id) === Number(req.user.user_id) ||
      Number(update.mentor_id) === Number(req.user.user_id);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this update" });
    res.json({ update });
  }),
);

router.get(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.params.taskId);
    if (!taskId) return res.status(400).json({ message: "taskId must be a positive integer" });
    const result = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);
    const task = result.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }
    res.json({ task });
  }),
);

router.patch(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.params.taskId);
    if (!taskId) return res.status(400).json({ message: "taskId must be a positive integer" });

    const existing = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }

    const managerCanEdit = isProgrammeManager(req.user.role) || Number(task.mentor_id) === Number(req.user.user_id);
    const allowedFields = managerCanEdit
      ? ["title", "description", "due_date", "status"]
      : ["status"];
    const updates = allowedFields.filter((field) => hasOwn(req.body, field));
    if (!updates.length) return res.status(400).json({ message: "No allowed fields supplied" });

    const validationError = validateTaskFields(req.body);
    if (validationError) return res.status(400).json({ message: validationError });
    if (hasOwn(req.body, "title") && typeof req.body.title === "string") {
      req.body.title = req.body.title.trim();
    }

    const values = updates.map((field) => req.body[field]);
    const setClause = updates.map((field, index) => field + " = $" + (index + 1)).join(", ");
    const result = await pool.query(
      "UPDATE tasks SET " + setClause + ", updated_at = CURRENT_TIMESTAMP WHERE task_id = $" + (values.length + 1) + " RETURNING *",
      [...values, taskId],
    );
    res.json({ message: "Task updated successfully", task: result.rows[0] });
  }),
);

router.delete(
  "/:taskId",
  authorize("MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.params.taskId);
    if (!taskId) return res.status(400).json({ message: "taskId must be a positive integer" });
    const result = await pool.query(
      "DELETE FROM tasks WHERE task_id = $1 AND ($2::text IN ('ADMIN','HR') OR mentor_id = $3) RETURNING *",
      [taskId, req.user.role, req.user.user_id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Task not found or not permitted" });
    res.json({ message: "Task deleted successfully" });
  }),
);

router.post(
  "/:taskId/updates",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.params.taskId);
    if (!taskId) return res.status(400).json({ message: "taskId must be a positive integer" });

    const { reflection, hours_worked: hoursWorked, update_date: updateDate } = req.body;
    if (typeof reflection !== "string" || !reflection.trim()) {
      return res.status(400).json({ message: "reflection is required" });
    }
    if (reflection.trim().length > 10000) {
      return res.status(400).json({ message: "reflection must be 10000 characters or fewer" });
    }
    const parsedHours = hoursWorked === null || hoursWorked === undefined || hoursWorked === "" ? null : Number(hoursWorked);
    if (parsedHours !== null && (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24)) {
      return res.status(400).json({ message: "hours_worked must be between 0 and 24" });
    }
    if (!isIsoDate(updateDate)) return res.status(400).json({ message: "update_date must use YYYY-MM-DD format or be null" });

    const taskResult = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (Number(task.intern_id) !== Number(req.user.user_id)) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    const result = await pool.query(
      "INSERT INTO daily_updates (task_id, intern_id, reflection, hours_worked, update_date) VALUES ($1,$2,$3,$4,COALESCE($5,CURRENT_DATE)) RETURNING *",
      [taskId, req.user.user_id, reflection.trim(), parsedHours, updateDate || null],
    );
    const sentiment = await requestSentimentAnalysis(req, {
      update_id: result.rows[0].update_id,
      intern_id: req.user.user_id,
      text: reflection.trim(),
      text_content: reflection.trim(),
    });
    res.status(201).json({
      message: "Daily update created successfully",
      update: result.rows[0],
      sentiment,
    });
  }),
);

router.get(
  "/:taskId/updates",
  asyncHandler(async (req, res) => {
    const taskId = toPositiveInteger(req.params.taskId);
    if (!taskId) return res.status(400).json({ message: "taskId must be a positive integer" });
    const taskResult = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [taskId]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user)) {
      return res.status(403).json({ message: "You do not have access to these updates" });
    }
    const result = await pool.query(
      "SELECT * FROM daily_updates WHERE task_id = $1 ORDER BY update_date DESC, update_id DESC",
      [taskId],
    );
    res.json({ updates: result.rows });
  }),
);

app.use("/api/tasks", router);
app.use(errorHandler);

const server = app.listen(PORT, () => console.log("Task Service running on port " + PORT));
const shutdown = () => server.close(() => pool.end(() => process.exit(0)));
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
