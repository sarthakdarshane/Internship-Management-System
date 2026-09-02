CREATE TABLE IF NOT EXISTS companies (
  company_id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internships (
  internship_id SERIAL PRIMARY KEY,
  intern_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  company_id INTEGER REFERENCES companies(company_id) ON DELETE SET NULL,
  company_name VARCHAR(160),
  internship_title VARCHAR(180) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS internships_intern_id_idx ON internships(intern_id);
CREATE INDEX IF NOT EXISTS internships_mentor_id_idx ON internships(mentor_id);
