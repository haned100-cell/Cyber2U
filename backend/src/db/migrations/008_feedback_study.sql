CREATE TABLE IF NOT EXISTS user_feedback_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journey_label VARCHAR(120) NOT NULL,
  journey_variant VARCHAR(40) NOT NULL,
  usability_rating INTEGER NOT NULL CHECK (usability_rating BETWEEN 1 AND 5),
  content_clarity_rating INTEGER NOT NULL CHECK (content_clarity_rating BETWEEN 1 AND 5),
  confidence_improvement_rating INTEGER NOT NULL CHECK (confidence_improvement_rating BETWEEN 1 AND 5),
  recommendation_rating INTEGER NOT NULL CHECK (recommendation_rating BETWEEN 1 AND 10),
  most_valuable_feature TEXT NOT NULL,
  biggest_pain_point TEXT,
  suggested_improvement TEXT,
  would_continue BOOLEAN NOT NULL DEFAULT true,
  screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_variant ON user_feedback_responses(journey_variant);
