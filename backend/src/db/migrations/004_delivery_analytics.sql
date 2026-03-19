-- Phase 7: Campaign Delivery and Analytics
CREATE TABLE IF NOT EXISTS campaign_deliveries (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  click_url VARCHAR(500),
  unsubscribed_at TIMESTAMP,
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT
);

CREATE TABLE IF NOT EXISTS campaign_analytics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER,
  delivered_count INTEGER,
  opened_count INTEGER,
  clicked_count INTEGER,
  unsubscribed_count INTEGER,
  bounce_count INTEGER,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  open_rate DECIMAL(5,2),
  click_through_rate DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_user_id ON campaign_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign_id ON campaign_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
