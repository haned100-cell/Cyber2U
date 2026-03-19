-- Phase 4: Content Operations and Version History
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL, -- 'weekly_email', 'monthly_assessment', 'case_study'
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, scheduled, sent, archived
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  scheduled_send_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_versions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255),
  subject_line VARCHAR(255),
  email_body_html TEXT,
  email_body_text TEXT,
  case_study_content TEXT,
  status VARCHAR(50), -- draft, review, approved
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  review_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  UNIQUE(campaign_id, version_number)
);

CREATE TABLE IF NOT EXISTS content_assets (
  id SERIAL PRIMARY KEY,
  campaign_version_id INTEGER NOT NULL REFERENCES campaign_versions(id) ON DELETE CASCADE,
  asset_type VARCHAR(50), -- 'image', 'icon', 'cta_button'
  asset_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_send_at ON campaigns(scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_campaign_id ON campaign_versions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_status ON campaign_versions(status);
