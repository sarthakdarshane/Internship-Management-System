CREATE TABLE IF NOT EXISTS sentiment_analysis (
  sentiment_id SERIAL PRIMARY KEY,
  update_id INTEGER NOT NULL,
  intern_id INTEGER NOT NULL,
  text_content TEXT NOT NULL,
  sentiment VARCHAR(12) NOT NULL CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
  score NUMERIC(4,3) NOT NULL CHECK (score >= 0 AND score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(update_id)
);

CREATE INDEX IF NOT EXISTS sentiment_analysis_intern_id_idx ON sentiment_analysis(intern_id);
