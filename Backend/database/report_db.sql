CREATE TABLE IF NOT EXISTS monthly_reports (
  report_id SERIAL PRIMARY KEY,
  intern_id INTEGER NOT NULL,
  internship_id INTEGER NOT NULL,
  month DATE NOT NULL,
  generated_by INTEGER NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(intern_id, internship_id, month)
);

CREATE INDEX IF NOT EXISTS monthly_reports_intern_id_idx ON monthly_reports(intern_id);
