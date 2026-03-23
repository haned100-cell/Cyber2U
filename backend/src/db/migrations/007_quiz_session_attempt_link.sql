ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session_id ON quiz_attempts(session_id);
