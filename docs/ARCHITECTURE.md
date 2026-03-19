# Cyber2U Architecture

## System Overview

Cyber2U is built with a three-tier architecture:

```
┌─────────────────────────────────────────┐
│     Frontend (React + TypeScript)        │
│  UI Layer: Pages, Components, State Mgmt │
└────────────────┬────────────────────────┘
                 │ HTTP/JSON
                 ▼
┌─────────────────────────────────────────┐
│   Backend (Express + TypeScript)         │
│  API Layer: Routes, Services, Business   │
└────────────────┬────────────────────────┘
                 │ SQL/TCP
                 ▼
┌─────────────────────────────────────────┐
│     Database (PostgreSQL)                │
│  Schema: Users, Quizzes, Progress, etc   │
└─────────────────────────────────────────┘
```

## Components

### Frontend

**Pages:**
- `Signup.tsx` — Email capture and magic-link request
- `VerifyEmail.tsx` — Token verification and onboarding
- `LearnerDashboard.tsx` — Progress tracking and insights
- `QuizPlayer.tsx` — Interactive quiz interface
- `admin/ContentEditor.tsx` — Create/edit campaigns (stub)
- `admin/CampaignScheduler.tsx` — Schedule sends (stub)
- `admin/AnalyticsDashboard.tsx` — KPI reporting (stub)

**Services:**
- `lib/api.ts` — Typed API client wrapping axios

### Backend

**Routes:**
- `routes/auth.routes.ts` — Magic-link auth, sessions, profiles
- `routes/quiz.routes.ts` — Quiz retrieval and submission
- `routes/progress.routes.ts` — User progress endpoints
- `routes/webhook.routes.ts` — Formsubmit integration (Phase 3)
- TODO: `routes/campaigns.routes.ts` — Campaign management
- TODO: `routes/analytics.routes.ts` — Analytics and reporting

**Services:**
- `services/auth.service.ts` — User creation, token generation, consent
- `services/email.service.ts` — Email templating and sending
- TODO: `services/quiz.service.ts` — Scoring logic
- TODO: `services/progress.service.ts` — Progress calculations
- TODO: `services/campaign.service.ts` — Scheduling and delivery

**Middleware:**
- `middleware/auth.ts` — JWT verification and optional auth

### Database

**Schemas:**
- Phase 1 (001): Users, email verification, sessions, consent
- Phase 2 (002): Campaigns, versions, content workflow
- Phase 3 (003): Quiz questions, attempts, progress snapshots
- Phase 4 (004): Campaign deliveries, analytics, audit logs
- Phase 5 (005): GDPR retention policies and deletion requests

## Data Flow

### Signup → Verification → Onboarding

```
1. User enters email in Signup page
   ↓ (POST /api/auth/request-magic-link)
2. Backend creates user + email_verification record
   ↓
3. Backend sends email with magic link
   ↓
4. User clicks link in email (VerifyEmail?token=xxx)
   ↓ (POST /api/auth/verify)
5. Backend verifies token, creates session
   ↓
6. Frontend stores JWT in localStorage
   ↓ (sends POST /api/auth/profile)
7. Backend returns user profile
   ↓
8. Frontend redirects to /dashboard
```

### Quiz Submission → Scoring → Progress Update

```
1. User views weekly quiz (GET /api/quiz/weekly)
   ↓
2. User submits answers (POST /api/quiz/:id/submit)
   ↓
3. Backend validates answers server-side (anti-tamper)
   ↓
4. Backend calculates score + topic-level results
   ↓
5. Backend updates user_progress_snapshots
   ↓
6. Frontend displays score and feedback
   ↓
7. User views updated dashboard with new progress
```

### Campaign Creation → Approval → Scheduling → Delivery

```
1. Admin creates campaign draft (POST /api/campaigns)
   ↓
2. Campaign goes to draft state, admin edits content
   ↓
3. Admin submits for review (PATCH /api/campaigns/:id/submit-review)
   ↓
4. Secondary admin reviews and approves (PATCH /api/campaigns/:id/approve)
   ↓
5. Campaign moved to approved state
   ↓
6. Admin schedules send time (PATCH /api/campaigns/:id/schedule)
   ↓
7. Campaign scheduler checks due campaigns every 5 minutes
   ↓
8. When time arrives, backend queues emails via provider
   ↓
9. Backend tracks opens/clicks via link instrumentation
   ↓
10. Analytics dashboard shows delivery metrics
```

## Key Design Decisions

### Authentication
- **Magic-link only** (no passwords) for lowest friction
- **JWT tokens** stored in localStorage for persistence
- **1-hour token expiry** then refresh via new magic-link request

### Scoring
- **Server-authoritative** — all scoring happens server-side to prevent tampering
- **Topic-weighted** — each question tagged with topic for mastery tracking
- **Immediate feedback** — user sees score and explanations right after submit

### Progress Tracking
- **Monthly snapshots** — user_progress_snapshots table stores calculated state
- **Trendline storage** — saves historical scores to compute month-over-month deltas
- **Topic breakdown** — JSONB column stores per-category mastery scores

### Email Delivery
- **Template rendering** — server generates personalized emails before send
- **Link tracking** — click URLs proxied through backend for instrumentation
- **Retry logic** — dead-letter queue for failed sends

### GDPR Compliance
- **Consent recording** — user_consents table logs when/where/how consent given
- **Audit trail** — audit_logs track all user account modifications
- **Data retention** — data_retention_policies define auto-purge windows per data type
- **Deletion requests** — users can request full erasure (soft delete + PII wipe)

## Security Considerations

1. **Input validation** — all user inputs validated server-side before storage
2. **SQL injection prevention** — parameterized queries with pg client
3. **CSRF protection** — SameSite cookies, origin header checking
4. **Rate limiting** — express-rate-limit on auth endpoints
5. **TLS/HTTPS** — mandatory in production
6. **Encryption in transit** — all data encrypted over HTTPS
7. **Session isolation** — each request authenticated independently
8. **CORS** — strict origin whitelist

## Error Handling

- **User-facing errors** — generic messages (e.g., "Verification failed")
- **Admin-facing errors** — detailed logs in server console
- **Graceful degradation** — fallback to MailHog if email fails in dev
- **Idempotency** — magic-link requests safely re-callable without duplication

## Performance Considerations

- **Database indexing** — indexes on frequently queried columns (user_id, campaign_id, created_at)
- **Connection pooling** — pg pool with default 10 connections
- **Caching opportunities** — quiz questions cached client-side after fetch
- **Async operations** — email sending doesn't block quiz submission
- **Pagination** — future analytics endpoints will paginate large result sets

## Testing Strategy

1. **Unit tests** — auth token generation, scoring logic, GDPR calculations
2. **Integration tests** — end-to-end flows (signup → verify → quiz → progress)
3. **E2E tests** — Playwright tests for full user journeys
4. **Load testing** — verify database performance with 1000+ concurrent users
5. **Accessibility testing** — WCAG 2.1 Level AA compliance for quiz UI
