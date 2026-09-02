CREATE TABLE IF NOT EXISTS tasks (
  task_id SERIAL PRIMARY KEY,
  internship_id INTEGER NOT NULL,
  intern_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  due_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_updates (
  update_id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
  intern_id INTEGER NOT NULL,
  reflection TEXT NOT NULL,
  hours_worked NUMERIC(4,2) CHECK (hours_worked >= 0 AND hours_worked <= 24),
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tasks_intern_id_idx ON tasks(intern_id);
CREATE INDEX IF NOT EXISTS tasks_mentor_id_idx ON tasks(mentor_id);
CREATE INDEX IF NOT EXISTS daily_updates_task_id_idx ON daily_updates(task_id);
CREATE INDEX IF NOT EXISTS daily_updates_intern_id_idx ON daily_updates(intern_id);
