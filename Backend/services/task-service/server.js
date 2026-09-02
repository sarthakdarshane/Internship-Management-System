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
app.use(cors());
app.use(express.json());

const isProgrammeManager = (role) => ["ADMIN", "HR"].includes(role);
const taskAccess = (task, user) =>
  isProgrammeManager(user.role) ||
  task.intern_id === user.user_id ||
  task.mentor_id === user.user_id;

app.get("/", (req, res) =>
  res.json({ message: "Task Service API is running" }),
);
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Task health check failed:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

const router = express.Router();
router.use(authenticate);

router.post(
  "/",
  authorize("MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const {
      internship_id,
      intern_id,
      mentor_id,
      title,
      description,
      due_date,
    } = req.body;
    if (!internship_id || !intern_id || !mentor_id || !title)
      return res
        .status(400)
        .json({
          message: "internship_id, intern_id, mentor_id and title are required",
        });
    if (req.user.role === "MENTOR" && Number(mentor_id) !== req.user.user_id)
      return res
        .status(403)
        .json({ message: "Mentors can only create their own tasks" });
    const result = await pool.query(
      "INSERT INTO tasks (internship_id, intern_id, mentor_id, title, description, due_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        internship_id,
        intern_id,
        mentor_id,
        title.trim(),
        description || null,
        due_date || null,
      ],
    );
    res
      .status(201)
      .json({ message: "Task created successfully", task: result.rows[0] });
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
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY task_id DESC",
    );
    res.json({ tasks: result.rows });
  }),
);

router.get(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const result = await pool.query("SELECT * FROM tasks WHERE task_id = $1", [
      req.params.taskId,
    ]);
    const task = result.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user))
      return res
        .status(403)
        .json({ message: "You do not have access to this task" });
    res.json({ task });
  }),
);

router.patch(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const existing = await pool.query(
      "SELECT * FROM tasks WHERE task_id = $1",
      [req.params.taskId],
    );
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user))
      return res
        .status(403)
        .json({ message: "You do not have access to this task" });
    const fields = ["title", "description", "due_date", "status"];
    const allowed =
      isProgrammeManager(req.user.role) || task.mentor_id === req.user.user_id
        ? fields
        : ["status"];
    const updates = allowed.filter((field) => Object.hasOwn(req.body, field));
    if (!updates.length)
      return res.status(400).json({ message: "No allowed fields supplied" });
    const values = updates.map((field) => req.body[field]);
    const setClause = updates
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const result = await pool.query(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE task_id = $${values.length + 1} RETURNING *`,
      [...values, task.task_id],
    );
    res.json({ message: "Task updated successfully", task: result.rows[0] });
  }),
);

router.delete(
  "/:taskId",
  authorize("MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "DELETE FROM tasks WHERE task_id = $1 AND ($2::text IN ('ADMIN','HR') OR mentor_id = $3) RETURNING *",
      [req.params.taskId, req.user.role, req.user.user_id],
    );
    if (!result.rows[0])
      return res
        .status(404)
        .json({ message: "Task not found or not permitted" });
    res.json({ message: "Task deleted successfully" });
  }),
);

router.post(
  "/:taskId/updates",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const { reflection, hours_worked, update_date } = req.body;
    if (!reflection?.trim())
      return res.status(400).json({ message: "reflection is required" });
    const taskResult = await pool.query(
      "SELECT * FROM tasks WHERE task_id = $1",
      [req.params.taskId],
    );
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.intern_id !== req.user.user_id)
      return res
        .status(403)
        .json({ message: "You can only update your own tasks" });
    const result = await pool.query(
      "INSERT INTO daily_updates (task_id, intern_id, reflection, hours_worked, update_date) VALUES ($1,$2,$3,$4,COALESCE($5,CURRENT_DATE)) RETURNING *",
      [
        task.task_id,
        req.user.user_id,
        reflection.trim(),
        hours_worked ?? null,
        update_date || null,
      ],
    );
    res
      .status(201)
      .json({
        message: "Daily update created successfully",
        update: result.rows[0],
      });
  }),
);

router.get(
  "/:taskId/updates",
  asyncHandler(async (req, res) => {
    const taskResult = await pool.query(
      "SELECT * FROM tasks WHERE task_id = $1",
      [req.params.taskId],
    );
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!taskAccess(task, req.user))
      return res
        .status(403)
        .json({ message: "You do not have access to these updates" });
    const result = await pool.query(
      "SELECT * FROM daily_updates WHERE task_id = $1 ORDER BY update_date DESC, update_id DESC",
      [task.task_id],
    );
    res.json({ updates: result.rows });
  }),
);

app.use("/api/tasks", router);
app.use(errorHandler);
const PORT = Number(process.env.PORT || 5003);
app.listen(PORT, () => console.log(`Task Service running on port ${PORT}`));
