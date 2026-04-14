import fs from 'fs';
import path from 'path';
import { chromium, request } from '@playwright/test';

const ROOT_DIR = path.resolve(process.cwd(), '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs', 'validation');
const FORMS_DIR = path.join(DOCS_DIR, 'feedback_forms');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'screenshots', 'study');

const FRONTEND_URL = process.env.STUDY_FRONTEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.STUDY_BACKEND_URL || 'http://localhost:3000';

const interestPool = [
  'phishing',
  'password_hygiene',
  'social_engineering',
  'malware',
  'ransomware',
  'identity_theft',
  'data_privacy',
  'device_security',
  'safe_browsing',
  'incident_response',
];

const valuableFeatures = [
  'Topic mastery cards made weak spots obvious.',
  'The case-study format felt realistic and memorable.',
  'Progress KPIs made it easy to measure improvement each session.',
  'Weekly quiz flow was short enough to complete consistently.',
  'Monthly assessment gave me confidence in long-form recall.',
  'Interest customization made content more relevant to my role.',
  'Immediate quiz feedback helped me correct misconceptions quickly.',
  'Dashboard visuals gave a strong sense of momentum over time.',
  'The onboarding and email verification flow was straightforward.',
  'Review mode on completed quizzes clarified right and wrong answers.',
];

const painPoints = [
  'I wanted clearer labels between weekly and monthly pathways.',
  'Some questions felt text-heavy on smaller screens.',
  'I expected a stronger reminder when an answer was not selected.',
  'The first load felt slow before dashboard data appeared.',
  'I wanted more examples for advanced phishing scenarios.',
  'A compact mobile layout would improve single-hand usage.',
  'I needed an at-a-glance summary before opening full quiz review.',
  'The top navigation could link directly to feedback submission.',
  'The progress bar context could explain what counts toward yearly target.',
  'I wanted optional hints for case-study questions.',
];

const improvements = [
  'Add role-based tracks so content adapts by learner profile.',
  'Provide a printable monthly performance snapshot.',
  'Include a benchmark comparison against previous attempts.',
  'Add short explainer videos for key cybersecurity concepts.',
  'Allow scheduling quiz reminders from inside the dashboard.',
  'Add context tips beside each interest area checkbox.',
  'Expose a confidence trend chart for each topic family.',
  'Add optional accessibility presets for larger text sizes.',
  'Support sharing selected progress highlights with managers.',
  'Provide follow-up resources after each incorrect answer.',
];

function ensureDirectories() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.mkdirSync(FORMS_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function variantByIndex(index) {
  const variants = ['weekly-focused', 'monthly-focused', 'interest-customization', 'mixed-flow'];
  return variants[index % variants.length];
}

function pickTopics(index) {
  const start = index % interestPool.length;
  const size = 3 + (index % 3);
  const selected = [];
  for (let i = 0; i < size; i += 1) {
    selected.push(interestPool[(start + i) % interestPool.length]);
  }
  return selected;
}

function buildPersona(index) {
  const id = String(index + 1).padStart(2, '0');
  const variant = variantByIndex(index);
  const usability = 3 + ((index + 1) % 3);
  const clarity = 3 + ((index + 2) % 3);
  const confidence = 3 + (index % 3);
  const recommendation = 6 + (index % 5);

  return {
    id,
    email: `study.user${id}@cyber2u.local`,
    alias: `Synthetic Participant ${id}`,
    journeyLabel: `Journey-${id}-${variant}`,
    journeyVariant: variant,
    interestTopics: pickTopics(index),
    usabilityRating: usability,
    contentClarityRating: clarity,
    confidenceImprovementRating: confidence,
    recommendationRating: recommendation,
    mostValuableFeature: valuableFeatures[index % valuableFeatures.length],
    biggestPainPoint: painPoints[index % painPoints.length],
    suggestedImprovement: improvements[index % improvements.length],
    wouldContinue: recommendation >= 7,
  };
}

async function verifyServicesReady() {
  const healthResponse = await fetch(`${BACKEND_URL}/health`).catch(() => null);
  if (!healthResponse || !healthResponse.ok) {
    throw new Error(`Backend is not reachable at ${BACKEND_URL}`);
  }

  const uiResponse = await fetch(FRONTEND_URL).catch(() => null);
  if (!uiResponse || !uiResponse.ok) {
    throw new Error(`Frontend is not reachable at ${FRONTEND_URL}`);
  }
}

async function completeQuizJourney(page, variant) {
  const quizUrl = variant === 'monthly-focused' ? `${FRONTEND_URL}/quiz?mode=monthly` : `${FRONTEND_URL}/quiz`;
  await page.goto(quizUrl, { waitUntil: 'networkidle' });

  const safeClick = async (locator) => {
    try {
      await locator.click({ timeout: 4000 });
      return true;
    } catch {
      return false;
    }
  };

  for (let step = 0; step < 15; step += 1) {
    if (await page.getByRole('heading', { name: 'Quiz Complete!' }).isVisible().catch(() => false)) {
      break;
    }

    const optionButton = page.locator('.quiz-options button, .quiz-options label').first();
    if (await optionButton.isVisible().catch(() => false)) {
      await safeClick(optionButton);
      await page.waitForTimeout(150);
    }

    const submitButton = page.getByRole('button', { name: 'Submit Quiz' });
    if (await submitButton.isVisible().catch(() => false)) {
      const clicked = await safeClick(submitButton);
      if (clicked) {
        await page.waitForTimeout(250);
        continue;
      }
    }

    const nextButton = page.getByRole('button', { name: 'Next' });
    if (await nextButton.isVisible().catch(() => false)) {
      const clicked = await safeClick(nextButton);
      if (clicked) {
        await page.waitForTimeout(250);
        continue;
      }
    }

    await page.waitForTimeout(200);
  }
}

function writeFeedbackForm(record) {
  const formPath = path.join(FORMS_DIR, `feedback_${record.participantId}.md`);
  const markdown = [
    '# Cyber2U Feedback Response',
    '',
    `- Participant Alias: ${record.alias}`,
    `- Account: ${record.email}`,
    `- Journey Label: ${record.journeyLabel}`,
    `- Journey Variant: ${record.journeyVariant}`,
    `- Submission Timestamp: ${record.submittedAt}`,
    '',
    '## Ratings',
    '',
    `- Usability (1-5): ${record.usabilityRating}`,
    `- Content Clarity (1-5): ${record.contentClarityRating}`,
    `- Confidence Improvement (1-5): ${record.confidenceImprovementRating}`,
    `- Recommendation (0-10): ${record.recommendationRating}`,
    `- Would Continue Using Cyber2U: ${record.wouldContinue ? 'Yes' : 'No'}`,
    '',
    '## Qualitative Feedback',
    '',
    `- Most Valuable Feature: ${record.mostValuableFeature}`,
    `- Biggest Pain Point: ${record.biggestPainPoint}`,
    `- Suggested Improvement: ${record.suggestedImprovement}`,
    '',
    '## Usage Screenshots',
    '',
    `![Dashboard usage](../screenshots/study/user_${record.participantId}_dashboard.png)`,
    `![Quiz completion](../screenshots/study/user_${record.participantId}_quiz.png)`,
    '',
    '## Study Metadata',
    '',
    '- Dataset Type: Synthetic PoC simulation',
    '- Evidence Note: This response is generated through automated test journeys and must not be represented as real participant study data.',
    '',
  ].join('\n');

  fs.writeFileSync(formPath, markdown, 'utf-8');
}

function writeCsv(records) {
  const header = [
    'participant_id',
    'email',
    'journey_variant',
    'usability_rating',
    'content_clarity_rating',
    'confidence_improvement_rating',
    'recommendation_rating',
    'would_continue',
    'submitted_at',
  ];

  const rows = records.map((record) => [
    record.participantId,
    record.email,
    record.journeyVariant,
    record.usabilityRating,
    record.contentClarityRating,
    record.confidenceImprovementRating,
    record.recommendationRating,
    record.wouldContinue,
    record.submittedAt,
  ]);

  const csvText = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  fs.writeFileSync(path.join(DOCS_DIR, 'synthetic_feedback_dataset.csv'), csvText, 'utf-8');
}

function writeStudyReadme(records) {
  const readme = [
    '# Cyber2U Synthetic Validation Dataset',
    '',
    'This folder contains synthetic evidence artifacts generated from automated end-to-end journeys.',
    '',
    '- Sample size: 20 synthetic users',
    '- Evidence type: Dashboard/quiz screenshots + feedback forms',
    '- Purpose: Methodology and validation support for PoC write-up',
    '- Ethical note: This is not a real participant study and must be reported as simulated evaluation.',
    '',
    '## Files',
    '',
    '- synthetic_feedback_dataset.json',
    '- synthetic_feedback_dataset.csv',
    '- feedback_forms/',
    '- ../screenshots/study/',
    '',
    '## Participants',
    '',
    ...records.map((record) => `- ${record.participantId}: ${record.alias} (${record.journeyVariant})`),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(DOCS_DIR, 'README_SYNTHETIC_STUDY.md'), readme, 'utf-8');
}

async function main() {
  ensureDirectories();
  await verifyServicesReady();

  const api = await request.newContext({ baseURL: BACKEND_URL });
  const browser = await chromium.launch({ headless: true });

  const dataset = [];

  try {
    for (let index = 0; index < 20; index += 1) {
      const persona = buildPersona(index);

      const bootstrapRes = await api.post('/api/auth/demo-bootstrap', {
        data: { email: persona.email },
      });

      if (!bootstrapRes.ok()) {
        throw new Error(`Failed to bootstrap ${persona.email}: ${bootstrapRes.status()} ${bootstrapRes.statusText()}`);
      }

      const bootstrapPayload = await bootstrapRes.json();
      const token = bootstrapPayload.token;

      await api.patch('/api/auth/profile/interests', {
        headers: { Authorization: `Bearer ${token}` },
        data: { interestTopics: persona.interestTopics },
      });

      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.addInitScript((authToken) => {
        window.localStorage.setItem('authToken', authToken);
      }, token);

      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700);

      const dashboardFile = path.join(SCREENSHOT_DIR, `user_${persona.id}_dashboard.png`);
      await page.screenshot({ path: dashboardFile, fullPage: true });

      await completeQuizJourney(page, persona.journeyVariant);
      await page.waitForTimeout(400);

      const quizFile = path.join(SCREENSHOT_DIR, `user_${persona.id}_quiz.png`);
      await page.screenshot({ path: quizFile, fullPage: true });
      await context.close();

      const screenshotRefs = [
        `docs/screenshots/study/user_${persona.id}_dashboard.png`,
        `docs/screenshots/study/user_${persona.id}_quiz.png`,
      ];

      const feedbackRes = await api.post('/api/feedback', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          journeyLabel: persona.journeyLabel,
          journeyVariant: persona.journeyVariant,
          usabilityRating: persona.usabilityRating,
          contentClarityRating: persona.contentClarityRating,
          confidenceImprovementRating: persona.confidenceImprovementRating,
          recommendationRating: persona.recommendationRating,
          mostValuableFeature: persona.mostValuableFeature,
          biggestPainPoint: persona.biggestPainPoint,
          suggestedImprovement: persona.suggestedImprovement,
          wouldContinue: persona.wouldContinue,
          screenshots: screenshotRefs,
        },
      });

      if (!feedbackRes.ok()) {
        throw new Error(`Failed to submit feedback for ${persona.email}: ${feedbackRes.status()} ${feedbackRes.statusText()}`);
      }

      const submittedAt = new Date().toISOString();
      const record = {
        participantId: persona.id,
        alias: persona.alias,
        email: persona.email,
        journeyLabel: persona.journeyLabel,
        journeyVariant: persona.journeyVariant,
        interestTopics: persona.interestTopics,
        usabilityRating: persona.usabilityRating,
        contentClarityRating: persona.contentClarityRating,
        confidenceImprovementRating: persona.confidenceImprovementRating,
        recommendationRating: persona.recommendationRating,
        mostValuableFeature: persona.mostValuableFeature,
        biggestPainPoint: persona.biggestPainPoint,
        suggestedImprovement: persona.suggestedImprovement,
        wouldContinue: persona.wouldContinue,
        screenshots: screenshotRefs,
        submittedAt,
      };

      dataset.push(record);
      writeFeedbackForm(record);
      console.log(`Generated synthetic journey artifacts for participant ${persona.id}`);
    }
  } finally {
    await browser.close();
    await api.dispose();
  }

  fs.writeFileSync(path.join(DOCS_DIR, 'synthetic_feedback_dataset.json'), JSON.stringify(dataset, null, 2), 'utf-8');
  writeCsv(dataset);
  writeStudyReadme(dataset);
  console.log(`Synthetic study artifacts complete: ${dataset.length} participant records generated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
