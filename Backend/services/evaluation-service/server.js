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
const dimensions = [
  "task_completion",
  "work_quality",
  "technical_skills",
  "communication",
  "problem_solving",
  "punctuality",
];
const weights = [0.3, 0.25, 0.15, 0.1, 0.1, 0.1];
const manager = (role) => ["ADMIN", "HR"].includes(role);

async function ensureSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS mentor_feedback (
    feedback_id SERIAL PRIMARY KEY, internship_id INTEGER NOT NULL, intern_id INTEGER NOT NULL, mentor_id INTEGER NOT NULL,
    comments TEXT NOT NULL, task_completion NUMERIC(5,2) NOT NULL CHECK (task_completion BETWEEN 0 AND 100),
    work_quality NUMERIC(5,2) NOT NULL CHECK (work_quality BETWEEN 0 AND 100), technical_skills NUMERIC(5,2) NOT NULL CHECK (technical_skills BETWEEN 0 AND 100),
    communication NUMERIC(5,2) NOT NULL CHECK (communication BETWEEN 0 AND 100), problem_solving NUMERIC(5,2) NOT NULL CHECK (problem_solving BETWEEN 0 AND 100),
    punctuality NUMERIC(5,2) NOT NULL CHECK (punctuality BETWEEN 0 AND 100), overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
}

function scoreFor(body) {
  const values = dimensions.map((dimension) => Number(body[dimension]));
  if (
    values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)
  )
    return null;
  return Number(
    values
      .reduce((total, value, index) => total + value * weights[index], 0)
      .toFixed(2),
  );
}

app.get("/", (req, res) =>
  res.json({ message: "Evaluation Service API is running" }),
);
app.get(
  "/health",
  asyncHandler(async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  }),
);
const router = express.Router();
router.use(authenticate);

router.post(
  "/",
  authorize("MENTOR", "ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const { internship_id, intern_id, mentor_id, comments } = req.body;
    const overall = scoreFor(req.body);
    if (
      !internship_id ||
      !intern_id ||
      !mentor_id ||
      !comments?.trim() ||
      overall === null
    )
      return res.status(400).json({
        message:
          "internship_id, intern_id, mentor_id, comments and six scores from 0 to 100 are required",
      });
    if (req.user.role === "MENTOR" && Number(mentor_id) !== req.user.user_id)
      return res
        .status(403)
        .json({ message: "Mentors can only submit their own evaluations" });
    const result = await pool.query(
      `INSERT INTO mentor_feedback (internship_id, intern_id, mentor_id, comments, task_completion, work_quality, technical_skills, communication, problem_solving, punctuality, overall_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        internship_id,
        intern_id,
        mentor_id,
        comments.trim(),
        ...dimensions.map((dimension) => Number(req.body[dimension])),
        overall,
      ],
    );
    res.status(201).json({
      message: "Evaluation saved successfully",
      evaluation: result.rows[0],
    });
  }),
);
router.get(
  "/mine",
  authorize("INTERN"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM mentor_feedback WHERE intern_id = $1 ORDER BY created_at DESC",
      [req.user.user_id],
    );
    res.json({ evaluations: result.rows });
  }),
);
router.get(
  "/assigned",
  authorize("MENTOR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM mentor_feedback WHERE mentor_id = $1 ORDER BY created_at DESC",
      [req.user.user_id],
    );
    res.json({ evaluations: result.rows });
  }),
);
router.get(
  "/",
  authorize("ADMIN", "HR"),
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM mentor_feedback ORDER BY created_at DESC",
    );
    res.json({ evaluations: result.rows });
  }),
);
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM mentor_feedback WHERE feedback_id = $1",
      [req.params.id],
    );
    const evaluation = result.rows[0];
    if (!evaluation)
      return res.status(404).json({ message: "Evaluation not found" });
    if (
      !manager(req.user.role) &&
      evaluation.intern_id !== req.user.user_id &&
      evaluation.mentor_id !== req.user.user_id
    )
      return res
        .status(403)
        .json({ message: "You do not have access to this evaluation" });
    res.json({ evaluation });
  }),
);
app.use("/api/evaluations", router);
app.use(errorHandler);
ensureSchema()
  .then(() =>
    app.listen(Number(process.env.PORT || 5005), () =>
      console.log(
        `Evaluation Service running on port ${process.env.PORT || 5005}`,
      ),
    ),
  )
  .catch((error) => {
    console.error("Evaluation schema initialization failed:", error.message);
    process.exit(1);
  });
