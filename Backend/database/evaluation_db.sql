CREATE TABLE IF NOT EXISTS mentor_feedback (
  feedback_id SERIAL PRIMARY KEY,
  internship_id INTEGER NOT NULL,
  intern_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  comments TEXT NOT NULL,
  task_completion NUMERIC(5,2) NOT NULL CHECK (task_completion BETWEEN 0 AND 100),
  work_quality NUMERIC(5,2) NOT NULL CHECK (work_quality BETWEEN 0 AND 100),
  technical_skills NUMERIC(5,2) NOT NULL CHECK (technical_skills BETWEEN 0 AND 100),
  communication NUMERIC(5,2) NOT NULL CHECK (communication BETWEEN 0 AND 100),
  problem_solving NUMERIC(5,2) NOT NULL CHECK (problem_solving BETWEEN 0 AND 100),
  punctuality NUMERIC(5,2) NOT NULL CHECK (punctuality BETWEEN 0 AND 100),
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS mentor_feedback_intern_id_idx ON mentor_feedback(intern_id);
CREATE INDEX IF NOT EXISTS mentor_feedback_mentor_id_idx ON mentor_feedback(mentor_id);
