-- Phase 9: GDPR and Data Retention
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(100) NOT NULL UNIQUE, -- 'email_verification_tokens', 'sessions', 'quiz_attempts', 'audit_logs'
  retention_days INTEGER NOT NULL,
  delete_after_revocation BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  status VARCHAR(50), -- 'pending', 'processing', 'completed'
  reason TEXT
);

INSERT INTO data_retention_policies (data_type, retention_days, delete_after_revocation) VALUES
  ('email_verification_tokens', 2, true),
  ('sessions', 30, true),
  ('quiz_attempts', 365, false),
  ('campaign_deliveries', 365, false),
  ('audit_logs', 365, false)
ON CONFLICT (data_type) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
