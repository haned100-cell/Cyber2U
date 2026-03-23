# Mixed Methods Approaches to Content Delivery in Cyber2U

## A Research Document on Pedagogical Design, Competitive Analysis, and Learning Support

---

**Document Version:** 1.0  
**Date:** March 2026  
**Repository:** Cyber2U — Interactive Email-Based Cybersecurity Awareness Platform  

---

## Abstract

This document presents a mixed methods research analysis of the content delivery strategies employed within the Cyber2U platform. Cyber2U is an email-driven cybersecurity awareness application designed to improve literacy, engagement, and measurable knowledge gains among learners. This document examines the theoretical and practical foundations of the platform's quiz design (including the rationale for combining qualitative and quantitative, short-form and long-form question types), conducts SWOT analyses of five leading competing platforms and of Cyber2U itself, and evaluates how the system's architecture is designed to support personalised, evidence-based learning. A methodology section describes the mixed methods research approach; a research section synthesises relevant literature and comparative analysis; and a validation section outlines the success criteria, KPIs, and testing strategy by which the platform's effectiveness will be evaluated.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Methodology](#2-methodology)
3. [Research](#3-research)
   - 3.1 [Theoretical Foundations](#31-theoretical-foundations)
   - 3.2 [SWOT Analysis of Existing Solutions](#32-swot-analysis-of-existing-solutions)
   - 3.3 [SWOT Analysis of Cyber2U](#33-swot-analysis-of-cyber2u)
   - 3.4 [Quiz Design Rationale](#34-quiz-design-rationale)
   - 3.5 [How the System Supports and Improves Learning Per User](#35-how-the-system-supports-and-improves-learning-per-user)
4. [Validation](#4-validation)
5. [Conclusion](#5-conclusion)
6. [References](#6-references)

---

## 1. Introduction

Cybersecurity threats continue to grow in frequency and sophistication. The UK Government's Cyber Security Breaches Survey 2024 reports that 50% of businesses and 32% of charities identified at least one cyber-attack in the preceding twelve months (Department for Science, Innovation and Technology, 2024). Verizon's annual Data Breach Investigations Report consistently identifies human error and social engineering as the primary vectors for breaches, with 68% of breaches involving a non-malicious human element (Verizon, 2024). Despite this, many organisations rely on infrequent, compliance-driven training that fails to produce durable knowledge change (Sasse, Brostoff and Weirich, 2001).

Cyber2U is designed to address this gap by combining regular, low-friction email-based content delivery with formative and summative assessments that track measurable improvement over time. The platform's architecture (React front-end, Express/TypeScript API, PostgreSQL) reflects a deliberate set of pedagogical choices: weekly micro-quizzes, monthly comprehensive assessments, per-topic mastery tracking, and personalised progress dashboards.

This document provides a research-informed justification for those choices, situates them within the competitive landscape, and establishes a validation framework for measuring platform effectiveness.

---

## 2. Methodology

### 2.1 Research Design

This study adopts a **mixed methods** research design, combining qualitative and quantitative approaches to generate a comprehensive understanding of cybersecurity education delivery. Creswell and Creswell (2018, p. 4) define mixed methods research as "an approach to inquiry involving collecting both quantitative and qualitative data, integrating the two forms of data, and using distinct designs that may involve philosophical assumptions and theoretical frameworks." This approach is appropriate here because neither quantitative metrics alone (quiz scores, completion rates, open rates) nor qualitative insights alone (user experience, content relevance, narrative feedback) can fully account for the complexity of learning behaviour in a digital environment.

The specific design used is a **convergent parallel mixed methods** approach (Creswell and Creswell, 2018): quantitative data (scores, improvement percentages, engagement metrics) and qualitative data (content analysis of question types, user-journey analysis, competitive evaluation) are collected concurrently and integrated at the point of interpretation.

### 2.2 Qualitative Strand

The qualitative strand involves:

- **Document analysis**: review of platform source code, database schemas, architecture documentation, and quiz content to characterise the intended learner experience.
- **Thematic analysis**: identification of recurring pedagogical themes across theoretical literature on e-learning, cybersecurity training, and human factors in security.
- **Competitive analysis**: structured SWOT evaluation of existing cybersecurity awareness platforms using publicly available product documentation, independent reviews, and academic commentary.

### 2.3 Quantitative Strand

The quantitative strand involves:

- **Performance metric analysis**: examination of the scoring model (weighted question scores, pass/fail thresholds, per-topic mastery ratios), progress snapshot calculations (improvement percentage = ((average − baseline) / baseline) × 100), and engagement KPIs (email open rates, quiz participation rates).
- **Objective benchmarking**: comparison of Cyber2U's measurable targets against industry-reported baselines.
- **Statistical validity**: review of how the platform's data model supports valid, reliable progress measurement over time (longitudinal `user_progress_snapshots` with `month_year` granularity).

### 2.4 Integration

Quantitative findings (e.g., a 20% target improvement in quiz scores) are interpreted alongside qualitative insights (e.g., why spaced repetition and retrieval practice theoretically produce score gains) to produce integrated conclusions about platform design effectiveness. The SWOT analyses, which blend objective feature comparison (quantitative) with strategic assessment of strengths and weaknesses (qualitative), are themselves a product of this integration.

### 2.5 Limitations

- As Cyber2U is at an early stage of development, longitudinal outcome data is not yet available; the quantitative strand draws on theoretical projections and pilot targets rather than empirical results.
- Competitive SWOT analyses rely on publicly available information; proprietary pricing, algorithm, and outcome data from competitors may not be fully disclosed.

---

## 3. Research

### 3.1 Theoretical Foundations

#### 3.1.1 Spaced Repetition and the Forgetting Curve

Ebbinghaus (1885, cited in Murre and Dros, 2015) demonstrated that memory retention decays exponentially after initial learning unless information is revisited at spaced intervals. This *forgetting curve* has been replicated extensively and forms the basis of spaced-repetition systems (SRS) used in modern e-learning platforms (Kornell and Bjork, 2008). Cyber2U operationalises this principle through its **weekly mini-quiz** (5 questions) cadence: rather than delivering a single, comprehensive annual training, the platform creates recurring touch-points that counteract memory decay. The weekly email cycle ensures that learners encounter cybersecurity concepts frequently enough to transfer them from working memory to long-term storage.

#### 3.1.2 Retrieval Practice

Roediger and Karpicke (2006) demonstrated that testing is not merely a means of measuring knowledge but is itself a powerful mechanism for consolidating it — a phenomenon termed the "testing effect." Learners who studied material and then took a test outperformed learners who only restudied the same material, even after delays of one week. This finding directly supports the decision to embed quizzes as a primary content-delivery mechanism in Cyber2U, rather than treating them as a supplementary evaluation tool.

#### 3.1.3 Bloom's Taxonomy and Cognitive Load

Bloom et al. (1956) proposed a hierarchical taxonomy of cognitive learning objectives, ranging from lower-order skills (remembering, understanding) to higher-order skills (analysing, evaluating, creating). Anderson and Krathwohl (2001) revised this taxonomy to better reflect contemporary learning science. Cyber2U's question design maps to multiple levels: *recall* questions (e.g., "What is phishing?") target the Remember level; scenario-based questions (e.g., "What should you do when you receive a suspicious email?") target Apply and Analyse levels.

Sweller (1988) introduced cognitive load theory, arguing that learning is impeded when the mental effort required exceeds working-memory capacity. Cyber2U mitigates extraneous cognitive load through:
- Short weekly quizzes (5 questions) that avoid overloading learners in a single session.
- Multiple-choice formats that reduce cognitive effort compared to open-ended recall.
- Immediate per-answer feedback that reduces the need to hold uncertainty in working memory.

#### 3.1.4 Kirkpatrick's Evaluation Model

Kirkpatrick and Kirkpatrick (2006) describe four levels of training evaluation:
1. **Reaction** — Did learners find the training engaging?
2. **Learning** — Did knowledge or skill increase?
3. **Behaviour** — Did learners change their real-world behaviour?
4. **Results** — Did the organisation benefit?

Cyber2U targets all four levels: email open and click-through rates measure Level 1 (reaction); quiz score improvements measure Level 2 (learning); the platform's long-term objective includes measurable reductions in security incidents (Levels 3 and 4), which will be assessed via quarterly reporting.

#### 3.1.5 Mayer's Multimedia Learning Theory

Mayer (2009) argues that people learn more deeply from words and pictures presented together than from words alone, provided the design adheres to principles of coherence, redundancy reduction, and modality alignment. While Cyber2U's current delivery is primarily text-based (email + quiz questions), the architecture anticipates multimedia content (HTML email bodies with embedded visuals, campaign case studies) aligned with these principles.

#### 3.1.6 Human Factors in Security

Sasse, Brostoff and Weirich (2001) argue that security failures are frequently attributable to systems that demand more of users than is cognitively sustainable. Effective security awareness training must therefore be usable: short, relevant, and delivered in the flow of normal working life. Cyber2U's email-first delivery model directly addresses this by meeting users where they already are (their email inbox) rather than demanding they seek out a separate learning platform.

---

### 3.2 SWOT Analysis of Existing Solutions

Five leading cybersecurity awareness platforms are evaluated below. Each SWOT analysis draws on publicly available product information and independent research.

---

#### 3.2.1 KnowBe4

KnowBe4 is the world's largest security awareness training provider, serving over 65,000 organisations globally (KnowBe4, 2024).

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | World's largest training library (1,000+ content modules) | High cost; enterprise pricing can be prohibitive for small organisations |
| | Industry-leading phishing simulation engine | Complex to administer; steep learning curve for content management |
| | Integrates with major identity providers (Okta, Azure AD) | Content can feel generic; limited personalisation for individual users |
| | AI-driven training recommendations based on simulated phishing performance | Primarily compliance-focused; limited evidence of long-term behaviour change |
| | Robust reporting and analytics dashboards | Relies on simulated threats; may cause distrust or anxiety in workforce |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Growing regulatory demand for cybersecurity training | New entrants (including AI-native platforms) offering lower-cost alternatives |
| | Expansion into SME market with lighter-weight products | Saturation of enterprise market |
| | Integration of AI to personalise training paths | Learner fatigue from overuse of simulated phishing |

**Sources:** KnowBe4 (2024); Osterman Research (2022)

---

#### 3.2.2 Proofpoint Security Awareness Training

Proofpoint's security awareness training platform is tightly integrated with its email security gateway, allowing training to be triggered by real (blocked) threats encountered by individual users (Proofpoint, 2023).

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | Unique "teachable moment" model: training triggered by real blocked threats | Requires Proofpoint email gateway; not suitable as a standalone product |
| | Rich threat intelligence data informs training relevance | High total cost of ownership when bundled with email security |
| | Detailed per-user risk scoring | Dashboard UX criticised as complex in independent reviews |
| | Wide range of content formats (video, interactive, micro-modules) | Content library smaller than KnowBe4's |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Leverage threat intelligence advantage as AI-generated attacks proliferate | Customers using competing email gateways are excluded |
| | Extend to mobile-first delivery | Privacy regulations may restrict use of behavioural data for training triggers |

**Sources:** Proofpoint (2023); Gartner Peer Insights (2023)

---

#### 3.2.3 Cofense (PhishMe)

Cofense (formerly PhishMe) specialises in phishing simulation and employee reporting behaviour (Cofense, 2023).

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | Best-in-class phishing simulation with high template realism | Narrowly focused on phishing; does not cover broader cybersecurity topics |
| | Industry-leading phishing reporting button (PhishMe Reporter) | Limited assessment and knowledge-testing capability compared to broader platforms |
| | Strong incident-response integration; simulated phish reports feed SOC workflows | Requires significant admin time to manage simulation campaigns |
| | High-quality phishing content library updated with current lures | Less suited to general security awareness than targeted phishing training |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Extend platform to cover broader threat categories | KnowBe4 and Proofpoint both offer phishing simulation, reducing differentiation |
| | AI-generated phishing simulation templates | Regulatory pushback on deceptive training simulations in some jurisdictions |

**Sources:** Cofense (2023); SC Media (2022)

---

#### 3.2.4 SANS Security Awareness (formerly SANS Securing the Human)

SANS is a globally respected cybersecurity training organisation. Its security awareness offering targets enterprise and government customers (SANS Institute, 2024).

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | Backed by SANS Institute's strong reputation in technical cybersecurity training | High cost; primarily enterprise-focused |
| | Research-backed, instructor-authored content | Less frequent content updates than larger commercial platforms |
| | Strong focus on behaviour change and culture, not just compliance | Limited phishing simulation capability compared to dedicated vendors |
| | Includes "Human Risk Report" annual benchmarking data | Dashboard and LMS less polished than enterprise SaaS competitors |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Leverage SANS brand trust to expand into mid-market | Losing market share to better-resourced SaaS platforms |
| | Develop AI-personalised training paths | NIST and other standards bodies increasingly prescribe specific training approaches that may not align with SANS methodology |

**Sources:** SANS Institute (2024); SANS Security Awareness Report (2023)

---

#### 3.2.5 Terranova Security (Now Part of Fortra)

Terranova Security is a Canadian security awareness training provider, acquired by Fortra in 2022. It is notable for its partnership with Microsoft and its "Gone Phishing Tournament" annual benchmark (Terranova Security, 2023).

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | Microsoft partnership provides seamless Microsoft 365 integration | Less known outside North American and European enterprise markets |
| | Annual phishing benchmark (Gone Phishing Tournament) provides useful industry data | Smaller content library relative to KnowBe4 or Proofpoint |
| | Strong multilingual content support | Post-acquisition integration risks may impact product roadmap |
| | Flexible deployment options (cloud, on-premise) | Dashboard and reporting less intuitive than leading competitors |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Microsoft 365 Copilot integration as AI awareness training becomes critical | Fortra's broad product portfolio may dilute security awareness focus |
| | Expand multilingual reach into Asia-Pacific and Latin American markets | Microsoft may develop native security awareness training capabilities |

**Sources:** Terranova Security (2023); Fortra (2022)

---

### 3.3 SWOT Analysis of Cyber2U

Cyber2U is positioned differently from the enterprise platforms above. It is designed as a lightweight, email-native, developer-friendly platform for raising cybersecurity literacy among students, employees in smaller organisations, and the general public.

| | **Strengths** | **Weaknesses** |
|---|---|---|
| | **Email-native delivery**: meets users in their existing workflow; no separate login or app required for content consumption | **Early-stage platform**: limited content library; quiz question bank requires significant expansion |
| | **Magic-link authentication**: removes password friction; zero-knowledge authentication reduces security risk and dropout rates | **No phishing simulation**: currently lacks the simulation capability of KnowBe4 or Cofense |
| | **Granular per-topic progress tracking**: JSONB topic_scores enable mastery-level breakdown across 10 cybersecurity domains | **Single-channel delivery**: currently email-only; no mobile app, browser extension, or LMS integration |
| | **Spaced repetition cadence**: weekly + monthly quiz rhythm operationalises evidence-based learning science | **Limited content formats**: primarily text-based; no video, audio, or interactive simulation modules yet |
| | **Server-authoritative scoring**: all scoring occurs server-side, preventing result tampering | **No enterprise integrations**: no LDAP, SCIM, or SSO integration; limits enterprise adoption |
| | **GDPR-compliant by design**: consent versioning, magic-link tokens, audit logs, right-to-erasure support built in from Phase 1 | **No AI personalisation**: training path is currently fixed; not yet adaptive based on individual risk profile |
| | **Open, extensible architecture**: TypeScript + PostgreSQL stack is well-understood, auditable, and deployable on commodity infrastructure | **Limited analytics**: campaign analytics and quarterly reporting are implemented but learner-facing insights are basic |
| | **Low cost to run**: containerised Docker stack; can run on a single small VPS | **Community and support**: no user community, support forum, or marketplace |

| | **Opportunities** | **Threats** |
|---|---|---|
| | Growing demand for affordable cybersecurity training in SME and education sectors | Enterprise platforms (KnowBe4, Proofpoint) offering SME-targeted tiers at reduced price points |
| | AI-driven adaptive learning paths based on per-topic mastery scores | AI-generated phishing and social engineering attacks will require rapid content updates |
| | Integration with popular email platforms (Gmail, Outlook) via plug-in | UK data protection enforcement may increase GDPR compliance burden |
| | Expansion into school and university curricula as part of digital literacy programmes | Low barriers to entry in the awareness training market mean many competitors |
| | Phishing simulation add-on using real-world threat intelligence | User fatigue with email-based training if content quality is not maintained |

---

### 3.4 Quiz Design Rationale

#### 3.4.1 Why Two Quiz Lengths: Weekly (5 Questions) and Monthly (10 Questions)?

The decision to offer a **weekly mini-quiz of 5 questions** and a **monthly assessment of 10 questions** is grounded in multiple bodies of evidence:

**Short weekly quizzes (5 questions) — formative / micro-learning:**

1. **Cognitive load management**: Sweller (1988) demonstrates that working memory is limited to approximately 4 ± 1 items. A 5-question quiz can be completed in under 3 minutes, staying well within the cognitive budget of a learner returning from their inbox.
2. **Spaced retrieval**: Regular short tests are more effective than infrequent long ones for long-term retention (Roediger and Karpicke, 2006). The weekly cadence creates the spaced intervals required to move knowledge from short-term to long-term memory.
3. **Habit formation**: Fogg (2019) argues that behaviours become habitual when they are small, frequent, and attached to an existing routine (the email check). A 5-question quiz embedded in a weekly email is designed to become habitual rather than effortful.
4. **Completion rates**: Bersin (2014) identifies that learners are far more likely to complete short modules (under 10 minutes) than long ones, particularly in a non-captive (i.e., non-mandatory) context.

**Monthly assessments (10 questions) — summative / comprehensive:**

1. **Summative evaluation**: Bloom et al. (1956) distinguishes formative assessment (ongoing, diagnostic) from summative assessment (end-of-period, evaluative). The monthly quiz serves a summative function: it samples across all ten topic categories to produce a holistic knowledge score that can be tracked month-over-month.
2. **Progress measurement**: The `user_progress_snapshots` table stores monthly averages and improvement percentages. Ten questions provide sufficient item count for statistically meaningful score variation; five questions alone would produce high variance and unreliable trend signals.
3. **Curriculum coverage**: With 10 quiz topics (phishing, password hygiene, social engineering, malware, ransomware, identity theft, data privacy, device security, safe browsing, incident response), a 10-question monthly assessment can sample each topic at least once per cycle.

#### 3.4.2 Why Multiple Question Types?

The platform's database schema supports three question types: `multiple_choice`, `true_false`, and `fill_blank`. This diversity is intentional:

**Multiple choice:**
- Enables objective, automatically scorable answers.
- Allows distractor analysis (which wrong answers are selected most often) to identify common misconceptions.
- Reduces cognitive load compared to open-ended questions, making the quiz more accessible to a non-expert audience.
- Widely validated in educational assessment literature (Haladyna and Rodriguez, 2013).

**True/False:**
- Provides rapid recall verification at the Remember level of Bloom's taxonomy.
- Suitable for factual claims (e.g., "Ransomware can be reversed without a decryption key — True or False?").
- Limitations: 50% chance probability; best used alongside other question types, not in isolation.

**Fill-in-the-blank:**
- Demands active retrieval rather than recognition, which produces stronger memory consolidation (Roediger and Karpicke, 2006).
- Targets higher-order cognitive levels (Apply, Analyse) by requiring learners to complete a scenario.
- More cognitively demanding; appropriate for monthly assessments and advanced users.

#### 3.4.3 Qualitative and Quantitative Dimensions of Quiz Design

The quiz system integrates both qualitative and quantitative dimensions:

**Quantitative elements:**
- Numeric percentage scores (0–100), enabling statistical tracking of improvement.
- Weighted scoring: `weight` column on `quiz_questions` allows more complex questions to carry proportionally more of the final score, reflecting their greater knowledge value.
- Pass/fail threshold: score ≥ 70% constitutes a pass, providing learners with a clear, unambiguous performance signal.
- Topic-level mastery ratios: per-topic percentage correct stored as JSONB, enabling quantitative identification of weakest areas.
- Time-spent tracking (`time_spent_seconds`) supports future difficulty calibration.

**Qualitative elements:**
- Per-option `feedback_on_select`: each answer option includes explanatory text shown upon selection. This transforms a binary right/wrong response into a learning moment — regardless of whether the answer is correct.
- Topic categorisation: each question is tagged with a `topic_category`, enabling the system to construct a narrative description of the learner's knowledge profile (e.g., "Strong in phishing awareness; needs improvement in incident response").
- Interest topic customisation: learners can specify which cybersecurity topics matter most to their context (via `user_interest_topics`), introducing a personalised, self-directed element to the learning experience.

#### 3.4.4 Why Immediate Feedback?

Hattie and Timperley (2007) conducted a meta-analysis of over 500 studies on feedback and found it to be one of the most powerful influences on learning outcomes. Importantly, they identified that effective feedback must be specific, timely, and actionable. Cyber2U delivers immediate per-answer feedback (via `feedback_on_select`) that:
- Is specific (explains why the answer is correct or incorrect).
- Is timely (appears at the moment of answer selection).
- Is actionable (provides the correct mental model for future application).

---

### 3.5 How the System Supports and Improves Learning Per User

#### 3.5.1 Personalised Progress Tracking

The `user_progress_snapshots` table stores a monthly record for each user containing:
- `total_quizzes_completed` — engagement indicator
- `average_score` — central performance metric
- `baseline_score` — first recorded score (used as denominator for improvement)
- `improvement_percentage` — ((average − baseline) / baseline) × 100
- `topic_scores` — JSONB dictionary of per-category mastery ratios

This architecture enables the learner dashboard to display not just a score but a trajectory: "Your average score has improved by 15% since you joined." This kind of feedback supports self-efficacy (Bandura, 1977) — the learner's belief in their ability to improve — which is a key predictor of continued engagement.

#### 3.5.2 Topic-Level Mastery

Rather than treating cybersecurity as a monolithic domain, Cyber2U disaggregates knowledge into 10 topic categories. This is consistent with Bloom's (1956) principle that learning objectives should be specific and measurable. A learner who scores 90% overall but only 40% on "Incident Response" receives qualitatively different guidance than a learner who scores uniformly across all categories.

The `getTopicMastery()` function in `progress.service.ts` computes per-topic mastery by weighting correct answers against all attempted questions in that category, then surfacing these as a structured JSON object for the dashboard. Future iterations can use this data to:
- Prioritise weakest topics in the next email campaign.
- Serve adaptive quizzes that focus on areas below a mastery threshold.
- Generate personalised "learning plans" for users.

#### 3.5.3 Interest Topic Customisation

The `user_interest_topics` table allows learners to declare which cybersecurity areas are most relevant to their personal or professional context. This is consistent with self-determination theory (Deci and Ryan, 1985), which identifies *autonomy* — the sense of personal agency in directing one's own learning — as a fundamental motivational driver. Allowing learners to shape the content they receive increases intrinsic motivation and reduces attrition.

#### 3.5.4 Email-First Delivery and Habit Formation

The email-first delivery model is a deliberate design choice rooted in behavioural science. Fogg (2019) argues that behaviour change is most effective when the new behaviour is:
1. **Tiny** — minimal effort required.
2. **Prompted** — triggered by an existing behaviour (opening email).
3. **Celebrated** — acknowledged with positive reinforcement.

Weekly emails containing a quiz link satisfy all three conditions: the quiz takes under 3 minutes (tiny); it arrives in the email inbox where users already spend time (prompted); and the immediate score and "passed/not passed" feedback provides reinforcement (celebrated).

#### 3.5.5 Magic-Link Authentication and Friction Reduction

The decision to use **magic-link authentication** (no passwords) rather than traditional username/password login reduces the cognitive barrier to quiz participation. Research in usable security (Bonneau et al., 2012) demonstrates that password friction is a leading cause of system abandonment. By removing the need to remember a password, Cyber2U increases the probability that learners will engage with weekly content rather than abandoning the flow at the login step.

#### 3.5.6 Server-Authoritative Scoring and Academic Integrity

All scoring logic in Cyber2U executes server-side (`scoring.service.ts`). Answers submitted by the client are validated against the database; scores are never accepted from the client. This is consistent with best practices in online assessment integrity and ensures that progress metrics are not gameable. Accurate scores are a precondition for valid progress tracking: if scores can be inflated by the learner, the `improvement_percentage` metric loses its diagnostic value.

#### 3.5.7 Campaign Analytics and Continuous Improvement

The platform includes a campaign analytics layer (`analytics.service.ts`, `campaign_analytics` table) that tracks:
- Open rates (percentage of delivered emails that were opened)
- Click-through rates (percentage of openers who clicked the quiz link)
- Quarterly aggregated reports by campaign and cohort

These metrics enable the platform administrator (and in future, the organisation delivering training) to identify which campaigns produce the highest engagement and knowledge gains, enabling evidence-based content iteration. This creates a **closed feedback loop**: content is delivered → engagement is measured → weakest content is improved → improved content is delivered.

---

## 4. Validation

### 4.1 Success Criteria and KPIs

The following KPIs, drawn from the platform's project objectives, constitute the primary quantitative validation criteria:

| Objective | KPI | Target | Measurement Method |
|-----------|-----|--------|-------------------|
| Email engagement | Open rate | +15% vs. baseline | `campaign_analytics.open_rate` |
| Email engagement | Click-through rate | +10% vs. baseline | `campaign_analytics.click_through_rate` |
| Email engagement | List growth | +20% over pilot period | `users` table count |
| Knowledge improvement | Average quiz score increase | +20% vs. baseline | `user_progress_snapshots.improvement_percentage` |
| Knowledge improvement | Quiz participation rate | ≥75% of active users | `quiz_sessions` vs. `users` |
| Knowledge improvement | Reduction in wrong answers | -30% per topic | `quiz_attempts.is_correct` per `topic_category` |
| Satisfaction and scalability | User satisfaction rating | ≥85% positive | Post-pilot survey |
| Satisfaction and scalability | Quarterly report generated | 100% on schedule | `analytics/quarterly-report` endpoint |

### 4.2 Testing Strategy

#### 4.2.1 Unit Testing (Backend)

The `scoring.service.ts` and `progress.service.ts` modules contain the core learning analytics logic. Unit tests (Jest, `backend/tests/`) validate:
- Correct score calculation from weighted questions.
- Correct `improvement_percentage` computation.
- Edge cases: zero baseline score, all-wrong answers, all-correct answers.
- Pass/fail determination at the 70% threshold boundary.

#### 4.2.2 Integration Testing

End-to-end flows tested via Playwright (`frontend/tests/e2e/`):
- **`demo-user-flow.spec.ts`**: Verifies that a user can complete the full flow: seed data → view dashboard → take quiz → see results.
- **`walkthrough-video.spec.ts`**: Records a complete user journey from signup through quiz completion, producing a video artifact for review.
- **`mailhog-inbox.spec.ts`**: Verifies that the magic-link email is correctly delivered and formatted.

#### 4.2.3 Accessibility Testing

The quiz UI is designed to be accessible in accordance with WCAG 2.1 Level AA (W3C, 2018). The `QuizPlayer.tsx` component uses semantic HTML elements (`<form>`, `<fieldset>`, `<legend>`, `<label>`) and role attributes to ensure screen-reader compatibility. Playwright accessibility snapshot tests can be added to validate ARIA compliance.

#### 4.2.4 Load Testing

For the pilot phase, load testing should verify that the platform can handle the target user cohort. The PostgreSQL connection pool (default 10 connections) is appropriate for a pilot of up to 200 concurrent users. For larger cohorts, connection pooling via PgBouncer should be introduced.

#### 4.2.5 GDPR Compliance Validation

The GDPR compliance model is validated by:
- **Consent capture tests**: verify that `user_consents` rows are created on signup.
- **Deletion request tests**: verify that a deletion request transitions through `pending → processing → completed` and that PII is anonymised.
- **Audit log tests**: verify that all state-changing actions (`quiz_submitted`, `email_verified`, `data_deleted`) produce `audit_logs` rows.
- **Token expiry tests**: verify that magic-link tokens older than 1 hour are rejected.

### 4.3 Qualitative Validation

Quantitative metrics alone cannot fully validate a learning platform's effectiveness. Kirkpatrick Level 3 (behaviour change) and Level 4 (organisational results) require qualitative evidence. The validation plan includes:

1. **Post-pilot learner survey** (Likert scale + open-ended questions) assessing:
   - Perceived relevance of quiz topics to daily work.
   - Confidence in applying cybersecurity knowledge after the programme.
   - Satisfaction with delivery format (email + dashboard).

2. **Administrator interviews**: structured interviews with two to three pilot administrators assessing campaign management usability and reporting utility.

3. **Content quality review**: independent review of quiz questions against Haladyna and Rodriguez's (2013) item-writing guidelines to identify ambiguous or flawed items.

4. **Longitudinal cohort study** (if pilot is extended to 6+ months): comparison of quiz score trajectories between high-engagement and low-engagement learner cohorts using `user_progress_snapshots` data.

---

## 5. Conclusion

Cyber2U's content delivery approach is grounded in an evidence-based integration of learning science, usable security research, and mixed methods evaluation design. The platform's weekly/monthly quiz cadence operationalises spaced retrieval theory; its three question types address different cognitive levels from the revised Bloom's taxonomy; its immediate per-answer feedback maximises the learning effect of each assessment; and its personalised progress dashboard supports learner self-efficacy and topic-specific improvement.

Compared to enterprise competitors (KnowBe4, Proofpoint, Cofense, SANS, Terranova), Cyber2U occupies a distinct niche: low-friction, email-native, GDPR-compliant, and accessible to organisations without enterprise budgets or IT teams. Its primary weaknesses — a limited question bank, no phishing simulation, and no AI personalisation — represent clear development priorities for future phases.

The validation framework defined in Section 4 provides a rigorous basis for evaluating whether these design choices produce the intended outcomes: a 20% improvement in average quiz scores, 75% participation, and 85% learner satisfaction. As the platform matures and longitudinal data accumulates, the mixed methods evaluation approach described in Section 2 will allow increasingly confident claims about Cyber2U's effectiveness as a cybersecurity awareness intervention.

---

## 6. References

Anderson, L.W. and Krathwohl, D.R. (eds.) (2001) *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives*. New York: Longman.

Bandura, A. (1977) 'Self-efficacy: Toward a Unifying Theory of Behavioral Change', *Psychological Review*, 84(2), pp. 191–215. Available at: https://doi.org/10.1037/0033-295X.84.2.191 (Accessed: 20 March 2026).

Bersin, J. (2014) *Spending on Corporate Training Soars: Employee Capabilities Now a Priority*. Forbes. Available at: https://www.forbes.com/sites/joshbersin/2014/02/04/the-recovery-arrives-corporate-training-spend-skyrockets/ (Accessed: 20 March 2026).

Bloom, B.S., Engelhart, M.D., Furst, E.J., Hill, W.H. and Krathwohl, D.R. (eds.) (1956) *Taxonomy of Educational Objectives: The Classification of Educational Goals. Handbook I: Cognitive Domain*. New York: David McKay.

Bonneau, J., Herley, C., van Oorschot, P.C. and Stajano, F. (2012) 'The Quest to Replace Passwords: A Framework for Comparative Evaluation of Web Authentication Schemes', in *2012 IEEE Symposium on Security and Privacy*, San Francisco, CA, May 2012. IEEE, pp. 553–567. Available at: https://doi.org/10.1109/SP.2012.44 (Accessed: 20 March 2026).

Cofense (2023) *Cofense Email Security: Phishing Detection and Response*. Available at: https://cofense.com (Accessed: 20 March 2026).

Creswell, J.W. and Creswell, J.D. (2018) *Research Design: Qualitative, Quantitative, and Mixed Methods Approaches*. 5th edn. Thousand Oaks, CA: Sage Publications.

Deci, E.L. and Ryan, R.M. (1985) *Intrinsic Motivation and Self-Determination in Human Behavior*. New York: Plenum Press. Available at: https://doi.org/10.1007/978-1-4899-2271-7 (Accessed: 20 March 2026).

Department for Science, Innovation and Technology (2024) *Cyber Security Breaches Survey 2024*. London: HMSO. Available at: https://www.gov.uk/government/statistics/cyber-security-breaches-survey-2024 (Accessed: 20 March 2026).

Fogg, B.J. (2019) *Tiny Habits: The Small Changes That Change Everything*. New York: Houghton Mifflin Harcourt.

Fortra (2022) *Fortra Acquires Terranova Security*. Available at: https://www.fortra.com/news/press-release/2022/fortra-acquires-terranova-security (Accessed: 20 March 2026).

Gartner Peer Insights (2023) *Security Awareness Computer-Based Training Reviews*. Gartner. Available at: https://www.gartner.com/reviews/market/security-awareness-computer-based-training (Accessed: 20 March 2026).

Haladyna, T.M. and Rodriguez, M.C. (2013) *Developing and Validating Test Items*. New York: Routledge. Available at: https://doi.org/10.4324/9780203850381 (Accessed: 20 March 2026).

Hattie, J. and Timperley, H. (2007) 'The Power of Feedback', *Review of Educational Research*, 77(1), pp. 81–112. Available at: https://doi.org/10.3102/003465430298487 (Accessed: 20 March 2026).

Kirkpatrick, D.L. and Kirkpatrick, J.D. (2006) *Evaluating Training Programs: The Four Levels*. 3rd edn. San Francisco: Berrett-Koehler Publishers.

KnowBe4 (2024) *Security Awareness Training Platform*. Available at: https://www.knowbe4.com (Accessed: 20 March 2026).

Kornell, N. and Bjork, R.A. (2008) 'Learning Concepts and Categories: Is Spacing the "Enemy of Induction"?', *Psychological Science*, 19(6), pp. 585–592. Available at: https://doi.org/10.1111/j.1467-9280.2008.02127.x (Accessed: 20 March 2026).

Mayer, R.E. (2009) *Multimedia Learning*. 2nd edn. Cambridge: Cambridge University Press. Available at: https://doi.org/10.1017/CBO9780511811678 (Accessed: 20 March 2026).

Murre, J.M.J. and Dros, J. (2015) 'Replication and Analysis of Ebbinghaus' Forgetting Curve', *PLOS ONE*, 10(7), e0120644. Available at: https://doi.org/10.1371/journal.pone.0120644 (Accessed: 20 March 2026).

Osterman Research (2022) *The Business Value of Security Awareness Training*. White Paper. Available at: https://www.knowbe4.com/resources/osterman-research-the-business-value-of-security-awareness-training (Accessed: 20 March 2026).

Proofpoint (2023) *State of the Phish 2023: An In-Depth Exploration of User Awareness, Vulnerability and Resilience*. Available at: https://www.proofpoint.com/us/resources/threat-reports/state-of-phish (Accessed: 20 March 2026).

Roediger, H.L. and Karpicke, J.D. (2006) 'Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention', *Psychological Science*, 17(3), pp. 249–255. Available at: https://doi.org/10.1111/j.1467-9280.2006.01693.x (Accessed: 20 March 2026).

SANS Institute (2024) *SANS Security Awareness: Human Risk Management*. Available at: https://www.sans.org/security-awareness-training/ (Accessed: 20 March 2026).

SANS Institute (2023) *SANS Security Awareness Report: Managing Human Cyber Risk*. Available at: https://www.sans.org/white-papers/sans-security-awareness-report-managing-human-cyber-risk/ (Accessed: 20 March 2026).

Sasse, M.A., Brostoff, S. and Weirich, D. (2001) 'Transforming the "Weakest Link": A Human/Computer Interaction Approach to Usable and Effective Security', *BT Technology Journal*, 19(3), pp. 122–131. Available at: https://doi.org/10.1023/A:1011902718709 (Accessed: 20 March 2026).

SC Media (2022) *Cofense Review: Phishing Simulation and Response Platform*. Available at: https://www.scmagazine.com/review/cofense (Accessed: 20 March 2026).

Sweller, J. (1988) 'Cognitive Load during Problem Solving: Effects on Learning', *Cognitive Science*, 12(2), pp. 257–285. Available at: https://doi.org/10.1207/s15516709cog1202_4 (Accessed: 20 March 2026).

Terranova Security (2023) *Gone Phishing Tournament: 2023 Global Phishing Benchmark Report*. Available at: https://www.terranovasecurity.com/gone-phishing-tournament (Accessed: 20 March 2026).

Verizon (2024) *2024 Data Breach Investigations Report*. Available at: https://www.verizon.com/business/resources/reports/dbir/ (Accessed: 20 March 2026).

W3C (2018) *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium. Available at: https://www.w3.org/TR/WCAG21/ (Accessed: 20 March 2026).
