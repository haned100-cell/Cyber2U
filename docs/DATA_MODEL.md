# Data Model

## Entity Relationship Diagram

```
users (1) ──────── (N) email_verifications
       │
       ├──────── (N) user_consents
       │
       ├──────── (N) sessions
       │
       ├──────── (N) quiz_attempts
       │
       ├──────── (N) quiz_sessions
       │
       ├──────── (N) user_progress_snapshots
       │
       ├──────── (N) campaign_deliveries
       │
       └──────── (N) deletion_requests

campaigns (1) ───────── (N) campaign_versions
          │
          ├──────── (N) quiz_questions
          │
          ├──────── (N) campaign_deliveries
          │
          └──────── (N) campaign_analytics

quiz_questions (1) ──────── (N) quiz_options
              │
              └──────── (N) quiz_attempts

quiz_sessions (1) ──────── (N) quiz_attempts

audit_logs (no FK) — logs all user actions

data_retention_policies — defines retention/purge rules
```

## Table Schemas

### Users

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP
);
```

**Purpose:** Core user entity
**Indices:** email (unique constraint)

### Email Verifications

```sql
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

**Purpose:** Magic-link token storage for signup verification
**Indices:** token (unique), user_id
**Lifecycle:** Token expires in 1 hour; once verified, `verified_at` is set; ignored afterward

### User Consents

```sql
CREATE TABLE user_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

**Purpose:** GDPR consent tracking (marketing emails, data collection, etc.)
**Indices:** user_id
**Values:** consent_type can be 'marketing_emails', 'data_collection', 'analytics'

### Sessions

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** JWT session storage for authentication
**Indices:** user_id, token
**Cleanup:** Sessions expire after `expires_at` (typically 7 days)

### Campaigns

```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  scheduled_send_at TIMESTAMP
);
```

**Purpose:** Campaign metadata and scheduling
**Status values:** draft, review, approved, scheduled, sent, archived
**Indices:** status, scheduled_send_at

### Campaign Versions

```sql
CREATE TABLE campaign_versions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(255),
  subject_line VARCHAR(255),
  email_body_html TEXT,
  email_body_text TEXT,
  case_study_content TEXT,
  status VARCHAR(50),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  review_notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  UNIQUE(campaign_id, version_number)
);
```

**Purpose:** Immutable version history for GDPR audit trail and rollback
**Status values:** draft, review, approved
**Lifecycle:** New version created on each save; old versions never modified

### Quiz Questions

```sql
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),
  topic_category VARCHAR(100),
  difficulty_level VARCHAR(20),
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Quiz question bank
**question_type values:** multiple_choice, true_false, fill_blank
**topic_category values:** phishing, password_hygiene, data_breach, social_engineering, malware, etc.
**difficulty_level values:** basic, intermediate, advanced
**weight:** multiplication factor for score calculation (e.g., weight=2 = double points)

### Quiz Options

```sql
CREATE TABLE quiz_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  feedback_on_select TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Multiple choice options for questions
**feedback_on_select:** Shown to user when this option selected (even if wrong)

### Quiz Attempts

```sql
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id INTEGER REFERENCES quiz_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Individual user answers for scoring and analysis
**is_correct:** Calculated server-side after submission
**time_spent_seconds:** Useful for difficulty assessment

### Quiz Sessions

```sql
CREATE TABLE quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id),
  session_type VARCHAR(50),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  total_score DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  passed BOOLEAN
);
```

**Purpose:** Quiz attempt aggregate (one row per completed quiz)
**session_type values:** weekly, monthly
**passed:** true if total_score >= passing_score

### User Progress Snapshots

```sql
CREATE TABLE user_progress_snapshots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_quizzes_completed INTEGER DEFAULT 0,
  total_score DECIMAL(7,2) DEFAULT 0,
  average_score DECIMAL(5,2),
  baseline_score DECIMAL(5,2),
  improvement_percentage DECIMAL(5,2),
  topic_scores JSONB,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  month_year VARCHAR(7)
);
```

**Purpose:** Calculated user progress (one row per user per month for trendlines)
**month_year:** YYYY-MM format for grouping
**topic_scores:** `{"phishing": 0.85, "passwords": 0.90}`
**improvement_percentage:** ((current - baseline) / baseline) * 100

### Campaign Deliveries

```sql
CREATE TABLE campaign_deliveries (
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
```

**Purpose:** Email delivery tracking for analytics
**Indices:** user_id, campaign_id, delivered_at
**Lifecycle:** Row created when email sent; `opened_at` set on pixel track; `clicked_at` on link click

### Campaign Analytics

```sql
CREATE TABLE campaign_analytics (
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
```

**Purpose:** Pre-calculated aggregates for fast reporting
**Calculated:** Generated by background job after each campaign send
**open_rate:** (opened_count / delivered_count) * 100

### Audit Logs

```sql
CREATE TABLE audit_logs (
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
```

**Purpose:** GDPR audit trail of all user account modifications
**Actions:** email_verified, logout, quiz_submitted, content_created, data_deleted, etc.
**Indices:** user_id, created_at
**Retention:** Typically 1-year per GDPR

### Data Retention Policies

```sql
CREATE TABLE data_retention_policies (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(100) NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  delete_after_revocation BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Defines auto-purge schedule for sensitive data
**Examples:**
- email_verification_tokens: 2 days
- sessions: 30 days
- quiz_attempts: 365 days
- audit_logs: 365 days

### Deletion Requests

```sql
CREATE TABLE deletion_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  status VARCHAR(50),
  reason TEXT
);
```

**Purpose:** Track GDPR right-to-erasure requests
**Status values:** pending, processing, completed
**Lifecycle:** User requests deletion → background job soft-deletes data → row marked completed

## Data Life Cycles

### User Creation to Deletion

```
1. User requests magic-link → email_verifications.expires_at = now + 1 hour
2. User clicks link → email_verifications.verified_at = now
3. Session created → sessions.expires_at = now + 7 days
4. User completes quiz → quiz_attempts recorded
5. Progress calculated → user_progress_snapshots updated
6. User requests deletion → deletion_requests.status = pending
7. Background job runs → soft-delete user, anonymize PII, purge old data
8. After 30 days → hard-delete abandoned records (data_retention_policies)
```

### Campaign Lifecycle

```
1. Admin creates campaign → campaigns.status = draft
2. Admin edits content → campaign_versions created for each save
3. Admin submits → campaigns.status = review
4. Reviewer approves → campaigns.status = approved
5. Admin schedules → campaigns.scheduled_send_at set
6. Scheduler triggers → queues emails, creates campaign_deliveries rows
7. Users open/click → campaign_deliveries updated with timestamps
8. Analytics job → aggregates campaign_analytics
9. After 1 year → audit_logs purged, campaign archived
```

## Indexes

**Recommended for Performance:**

```sql
CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_question_id ON quiz_attempts(question_id);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_progress_snapshots_user_id ON user_progress_snapshots(user_id);
CREATE INDEX idx_progress_snapshots_month_year ON user_progress_snapshots(month_year);
CREATE INDEX idx_campaign_deliveries_user_id ON campaign_deliveries(user_id);
CREATE INDEX idx_campaign_deliveries_campaign_id ON campaign_deliveries(campaign_id);
CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_send_at ON campaigns(scheduled_send_at);
```
