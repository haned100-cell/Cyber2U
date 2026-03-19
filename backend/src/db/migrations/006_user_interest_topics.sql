-- Phase 9: User cybersecurity interest preferences
ALTER TABLE users
ADD COLUMN IF NOT EXISTS interest_topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
