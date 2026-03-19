-- Phase 5 & 6: Quiz Engine and Progress Tracking
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50), -- 'multiple_choice', 'true_false', 'fill_blank'
  topic_category VARCHAR(100), -- 'phishing', 'password_hygiene', 'data_breach', etc.
  difficulty_level VARCHAR(20), -- 'basic', 'intermediate', 'advanced'
  weight INTEGER DEFAULT 1, -- for scoring calculation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  feedback_on_select TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id INTEGER REFERENCES quiz_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id),
  session_type VARCHAR(50), -- 'weekly', 'monthly'
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_score DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  passed BOOLEAN
);

CREATE TABLE IF NOT EXISTS user_progress_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_score DECIMAL(7,2) DEFAULT 0,
  average_score DECIMAL(5,2),
  baseline_score DECIMAL(5,2),
  improvement_percentage DECIMAL(5,2),
  topic_scores JSONB, -- e.g., {"phishing": 0.85, "passwords": 0.90}
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  month_year VARCHAR(7) -- YYYY-MM for monthly tracking
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_question_id ON quiz_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_campaign_id ON quiz_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_user_id ON user_progress_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_snapshots_month_year ON user_progress_snapshots(month_year);
