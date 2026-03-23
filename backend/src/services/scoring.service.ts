import { PoolClient } from 'pg';
import { pool } from '../db';

export interface QuizOption {
  id: number;
  option_text: string;
}

export interface QuizQuestionForClient {
  id: number;
  question_text: string;
  question_type: string;
  options: QuizOption[];
}

export interface QuizSessionPayload {
  sessionId: number;
  questions: QuizQuestionForClient[];
}

export interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  topicScores: Record<string, number>;
}

export interface QuizHistoryItem {
  sessionId: number;
  sessionType: 'weekly' | 'monthly';
  startedAt: string;
  completedAt: string;
  totalScore: number;
  passed: boolean;
  questionCount: number;
}

export interface QuizReviewQuestion {
  questionId: number;
  questionText: string;
  questionType: string;
  selectedOptionId: number;
  correctOptionId: number;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
  options: QuizOption[];
}

export interface QuizReviewPayload {
  sessionId: number;
  sessionType: 'weekly' | 'monthly';
  completedAt: string;
  totalScore: number;
  passed: boolean;
  questions: QuizReviewQuestion[];
}

interface AnswerTuple {
  questionId: number;
  selectedOptionId: number;
}

interface QuestionOptionRow {
  question_id: number;
  weight: number;
  topic_category: string | null;
  option_id: number;
  is_correct: boolean;
}

interface ReviewRow {
  session_id: number;
  session_type: 'weekly' | 'monthly';
  completed_at: string;
  total_score: number;
  passed: boolean;
  question_id: number;
  question_text: string;
  question_type: string;
  selected_option_id: number;
  selected_option_text: string;
  correct_option_id: number;
  correct_option_text: string;
  is_correct: boolean;
}

const PASSING_SCORE = 70;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isCaseStudyQuestion(question: QuizQuestionForClient): boolean {
  return question.question_type.startsWith('case_study');
}

async function seedDefaultQuestion(client: PoolClient): Promise<void> {
  const seedBank = [
    {
      questionText: 'What is the safest first action when you receive a suspicious email?',
      questionType: 'multiple_choice',
      topicCategory: 'phishing',
      difficultyLevel: 'basic',
      weight: 1,
      options: [
        { text: 'Check sender address and links before clicking anything', isCorrect: true },
        { text: 'Open attachments immediately to inspect the file', isCorrect: false },
        { text: 'Reply with personal details to confirm your identity', isCorrect: false },
        { text: 'Forward to contacts to ask if they received it', isCorrect: false },
      ],
    },
    {
      questionText: 'True or False: A long unique password should be reused across all accounts for convenience.',
      questionType: 'true_false',
      topicCategory: 'password_hygiene',
      difficultyLevel: 'basic',
      weight: 1,
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
    },
    {
      questionText: 'Fill in the blank: Before entering credentials, verify the site uses ____ and the domain is correct.',
      questionType: 'fill_blank',
      topicCategory: 'safe_browsing',
      difficultyLevel: 'basic',
      weight: 1,
      options: [
        { text: 'HTTPS', isCorrect: true },
        { text: 'public Wi-Fi', isCorrect: false },
        { text: 'browser extensions only', isCorrect: false },
        { text: 'incognito mode', isCorrect: false },
      ],
    },
    {
      questionText: 'Which action best reduces ransomware risk in a small business?',
      questionType: 'multiple_choice',
      topicCategory: 'ransomware',
      difficultyLevel: 'intermediate',
      weight: 2,
      options: [
        { text: 'Maintain tested offline backups and patch critical systems', isCorrect: true },
        { text: 'Disable endpoint protection to improve system speed', isCorrect: false },
        { text: 'Allow all macros for productivity', isCorrect: false },
        { text: 'Store all backups on the same production server', isCorrect: false },
      ],
    },
    {
      questionText: 'True or False: Sharing one-time MFA codes with IT support staff is acceptable if they ask politely.',
      questionType: 'true_false',
      topicCategory: 'social_engineering',
      difficultyLevel: 'basic',
      weight: 1,
      options: [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: true },
      ],
    },
    {
      questionText: 'Fill in the blank: The principle of least privilege means users get only the ____ needed for their role.',
      questionType: 'fill_blank',
      topicCategory: 'device_security',
      difficultyLevel: 'intermediate',
      weight: 2,
      options: [
        { text: 'minimum access', isCorrect: true },
        { text: 'administrator rights', isCorrect: false },
        { text: 'shared credentials', isCorrect: false },
        { text: 'default permissions', isCorrect: false },
      ],
    },
    {
      questionText:
        'Case Study (Real): A finance assistant receives an email that appears to be from the CFO requesting an urgent wire transfer to a new vendor account before end of day. The display name is correct, but the sender domain has a subtle typo.\n\nQuestion: What went wrong first?',
      questionType: 'case_study_real',
      topicCategory: 'phishing',
      difficultyLevel: 'intermediate',
      weight: 2,
      options: [
        { text: 'The assistant trusted the display name and urgency without verifying sender domain or via a second channel', isCorrect: true },
        { text: 'The assistant replied asking for invoice details before paying', isCorrect: false },
        { text: 'The assistant escalated to security before sending funds', isCorrect: false },
        { text: 'The assistant compared the request with prior approved vendor records', isCorrect: false },
      ],
    },
    {
      questionText:
        'Case Study (Simulated): You see a social post offering free conference tickets if you sign in using your corporate account on a third-party page. The page looks polished and asks for MFA after password entry.\n\nQuestion: What should have been done first?',
      questionType: 'case_study_fake',
      topicCategory: 'social_engineering',
      difficultyLevel: 'intermediate',
      weight: 2,
      options: [
        { text: 'Verify the campaign through official company channels and avoid signing in from the external link', isCorrect: true },
        { text: 'Enter credentials quickly before the offer expires', isCorrect: false },
        { text: 'Share the post with teammates to check if it is safe', isCorrect: false },
        { text: 'Disable MFA temporarily to avoid lockout issues', isCorrect: false },
      ],
    },
    {
      questionText:
        'Case Study (Real): An employee plugs in an unknown USB drive found in the office parking lot to identify the owner. Within minutes, suspicious scripts execute and files begin encrypting.\n\nQuestion: What should have been done instead?',
      questionType: 'case_study_real',
      topicCategory: 'malware',
      difficultyLevel: 'advanced',
      weight: 2,
      options: [
        { text: 'Report the device to IT/security and never connect unknown removable media', isCorrect: true },
        { text: 'Scan the USB after opening files to see if anything is wrong', isCorrect: false },
        { text: 'Copy the files to a personal laptop before reporting', isCorrect: false },
        { text: 'Upload the files to cloud storage for easier analysis', isCorrect: false },
      ],
    },
    {
      questionText:
        'Case Study (Simulated): A teammate messages in chat asking for your one-time MFA code because they are locked out and need to submit payroll before 5 PM.\n\nQuestion: What is the correct response?',
      questionType: 'case_study_fake',
      topicCategory: 'identity_theft',
      difficultyLevel: 'basic',
      weight: 1,
      options: [
        { text: 'Do not share the code; verify identity by calling the teammate directly or directing them to IT support', isCorrect: true },
        { text: 'Share the code once and immediately change password', isCorrect: false },
        { text: 'Ask for their manager name and then send the code', isCorrect: false },
        { text: 'Post the code in the team channel for transparency', isCorrect: false },
      ],
    },
  ];

  for (const entry of seedBank) {
    const existing = await client.query('SELECT id FROM quiz_questions WHERE question_text = $1 LIMIT 1', [
      entry.questionText,
    ]);

    let questionId: number;
    if (existing.rows.length > 0) {
      questionId = existing.rows[0].id as number;
      await client.query('DELETE FROM quiz_options WHERE question_id = $1', [questionId]);
      await client.query(
        `UPDATE quiz_questions
         SET question_type = $2, topic_category = $3, difficulty_level = $4, weight = $5, updated_at = NOW()
         WHERE id = $1`,
        [questionId, entry.questionType, entry.topicCategory, entry.difficultyLevel, entry.weight]
      );
    } else {
      const insertedQuestion = await client.query(
        `INSERT INTO quiz_questions (question_text, question_type, topic_category, difficulty_level, weight)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [entry.questionText, entry.questionType, entry.topicCategory, entry.difficultyLevel, entry.weight]
      );
      questionId = insertedQuestion.rows[0].id as number;
    }

    for (const option of entry.options) {
      await client.query(
        `INSERT INTO quiz_options (question_id, option_text, is_correct, feedback_on_select)
         VALUES ($1, $2, $3, $4)`,
        [questionId, option.text, option.isCorrect, option.isCorrect ? 'Correct answer.' : 'Not correct.']
      );
    }
  }
}

async function getRandomQuestionsWithOptions(limit: number): Promise<QuizQuestionForClient[]> {
  const rows = await pool.query(
    `SELECT
       q.id,
       q.question_text,
       q.question_type,
       qo.id AS option_id,
       qo.option_text
     FROM quiz_questions q
     JOIN quiz_options qo ON qo.question_id = q.id
     ORDER BY q.id, qo.id`
  );

  if (rows.rows.length === 0) {
    return [];
  }

  const grouped = new Map<number, QuizQuestionForClient>();
  for (const row of rows.rows) {
    const questionId = row.id as number;
    if (!grouped.has(questionId)) {
      grouped.set(questionId, {
        id: questionId,
        question_text: row.question_text,
        question_type: row.question_type,
        options: [],
      });
    }

    grouped.get(questionId)?.options.push({
      id: row.option_id,
      option_text: row.option_text,
    });
  }

  const allQuestions = Array.from(grouped.values());
  const caseStudies = shuffleArray(allQuestions.filter(isCaseStudyQuestion));
  const realCaseStudies = shuffleArray(
    caseStudies.filter((question) => question.question_type === 'case_study_real')
  );
  const simulatedCaseStudies = shuffleArray(
    caseStudies.filter((question) => question.question_type === 'case_study_fake')
  );
  const nonCaseStudies = shuffleArray(allQuestions.filter((question) => !isCaseStudyQuestion(question)));

  const selected: QuizQuestionForClient[] = [];
  const caseStudyTarget = Math.min(2, limit, caseStudies.length);

  if (caseStudyTarget > 0 && realCaseStudies.length > 0) {
    selected.push(realCaseStudies[0]);
  }

  if (
    caseStudyTarget > 1 &&
    simulatedCaseStudies.length > 0 &&
    !selected.some((question) => question.id === simulatedCaseStudies[0].id)
  ) {
    selected.push(simulatedCaseStudies[0]);
  }

  const fallbackCaseStudies = shuffleArray(
    caseStudies.filter((question) => !selected.some((picked) => picked.id === question.id))
  );

  for (const question of fallbackCaseStudies) {
    if (selected.length >= caseStudyTarget) {
      break;
    }
    selected.push(question);
  }

  for (const question of nonCaseStudies) {
    if (selected.length >= limit) {
      break;
    }
    selected.push(question);
  }

  if (selected.length < limit) {
    const leftovers = shuffleArray(
      allQuestions.filter((question) => !selected.some((picked) => picked.id === question.id))
    );

    for (const question of leftovers) {
      if (selected.length >= limit) {
        break;
      }
      selected.push(question);
    }
  }

  return shuffleArray(selected).slice(0, limit);
}

async function ensureQuestionsExist(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seedDefaultQuestion(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function createQuizSession(userId: number, sessionType: 'weekly' | 'monthly'): Promise<number> {
  const result = await pool.query(
    `INSERT INTO quiz_sessions (user_id, session_type)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, sessionType]
  );

  return result.rows[0].id as number;
}

export async function getQuizSessionPayload(
  userId: number,
  sessionType: 'weekly' | 'monthly',
  limit: number
): Promise<QuizSessionPayload> {
  await ensureQuestionsExist();
  const sessionId = await createQuizSession(userId, sessionType);
  const questions = await getRandomQuestionsWithOptions(limit);

  return { sessionId, questions };
}

function parseAnswers(answers: Record<string, unknown>): AnswerTuple[] {
  const parsed: AnswerTuple[] = [];

  for (const [questionIdRaw, optionIdRaw] of Object.entries(answers)) {
    const questionId = Number(questionIdRaw);
    const selectedOptionId = Number(optionIdRaw);

    if (!Number.isInteger(questionId) || !Number.isInteger(selectedOptionId)) {
      continue;
    }

    parsed.push({ questionId, selectedOptionId });
  }

  return parsed;
}

export async function submitQuizSession(
  userId: number,
  sessionId: number,
  answersInput: Record<string, unknown>
): Promise<QuizSubmissionResult> {
  const sessionResult = await pool.query(
    `SELECT id, completed_at
     FROM quiz_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error('Quiz session not found');
  }

  if (sessionResult.rows[0].completed_at) {
    throw new Error('Quiz session already submitted');
  }

  const answers = parseAnswers(answersInput);
  if (answers.length === 0) {
    throw new Error('No valid answers provided');
  }

  const questionIds = answers.map((a) => a.questionId);

  const optionRows = await pool.query(
    `SELECT
       q.id AS question_id,
       COALESCE(q.weight, 1) AS weight,
       q.topic_category,
       qo.id AS option_id,
       qo.is_correct
     FROM quiz_questions q
     JOIN quiz_options qo ON qo.question_id = q.id
     WHERE q.id = ANY($1::int[])`,
    [questionIds]
  );

  const optionsByQuestion = new Map<number, QuestionOptionRow[]>();
  for (const row of optionRows.rows as QuestionOptionRow[]) {
    if (!optionsByQuestion.has(row.question_id)) {
      optionsByQuestion.set(row.question_id, []);
    }
    optionsByQuestion.get(row.question_id)?.push(row);
  }

  const topicTotals = new Map<string, { earned: number; possible: number }>();
  let earnedWeight = 0;
  let totalWeight = 0;
  let correctAnswers = 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const answer of answers) {
      const options = optionsByQuestion.get(answer.questionId);
      if (!options || options.length === 0) {
        throw new Error(`Invalid question id ${answer.questionId}`);
      }

      const selected = options.find((o) => o.option_id === answer.selectedOptionId);
      if (!selected) {
        throw new Error(`Invalid option for question ${answer.questionId}`);
      }

      const weight = Number(options[0].weight) || 1;
      const topic = options[0].topic_category || 'general';
      const isCorrect = Boolean(selected.is_correct);

      totalWeight += weight;
      if (isCorrect) {
        earnedWeight += weight;
        correctAnswers += 1;
      }

      const currentTopic = topicTotals.get(topic) || { earned: 0, possible: 0 };
      currentTopic.possible += weight;
      if (isCorrect) {
        currentTopic.earned += weight;
      }
      topicTotals.set(topic, currentTopic);

      await client.query(
        `INSERT INTO quiz_attempts (user_id, question_id, selected_option_id, is_correct, session_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, answer.questionId, answer.selectedOptionId, isCorrect, sessionId]
      );
    }

    const score = totalWeight > 0 ? roundToTwo((earnedWeight / totalWeight) * 100) : 0;
    const passed = score >= PASSING_SCORE;

    await client.query(
      `UPDATE quiz_sessions
       SET completed_at = NOW(), total_score = $2, passing_score = $3, passed = $4
       WHERE id = $1`,
      [sessionId, score, PASSING_SCORE, passed]
    );

    await client.query('COMMIT');

    const topicScores: Record<string, number> = {};
    for (const [topic, value] of topicTotals.entries()) {
      topicScores[topic] = value.possible > 0 ? roundToTwo(value.earned / value.possible) : 0;
    }

    return {
      score,
      passed,
      correctAnswers,
      totalQuestions: answers.length,
      topicScores,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getCompletedQuizHistory(userId: number): Promise<QuizHistoryItem[]> {
  const result = await pool.query(
    `SELECT
       qs.id AS session_id,
       qs.session_type,
       qs.started_at,
       qs.completed_at,
       COALESCE(qs.total_score, 0)::float AS total_score,
       COALESCE(qs.passed, false) AS passed,
       COALESCE(COUNT(DISTINCT qa.question_id), 0)::int AS question_count
     FROM quiz_sessions qs
     LEFT JOIN quiz_attempts qa
       ON qa.session_id = qs.id
      AND qa.user_id = qs.user_id
     WHERE qs.user_id = $1
       AND qs.completed_at IS NOT NULL
     GROUP BY qs.id
     HAVING COUNT(DISTINCT qa.question_id) > 0
     ORDER BY qs.completed_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    sessionId: row.session_id,
    sessionType: row.session_type,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalScore: roundToTwo(Number(row.total_score || 0)),
    passed: Boolean(row.passed),
    questionCount: Number(row.question_count || 0),
  }));
}

export async function getQuizSessionReview(userId: number, sessionId: number): Promise<QuizReviewPayload> {
  const result = await pool.query(
    `SELECT
       qs.id AS session_id,
       qs.session_type,
       qs.completed_at,
       COALESCE(qs.total_score, 0)::float AS total_score,
       COALESCE(qs.passed, false) AS passed,
       qa.question_id,
       q.question_text,
       q.question_type,
       qa.selected_option_id,
       sel.option_text AS selected_option_text,
       corr.id AS correct_option_id,
       corr.option_text AS correct_option_text,
       COALESCE(qa.is_correct, false) AS is_correct
     FROM quiz_sessions qs
     JOIN quiz_attempts qa ON qa.session_id = qs.id
     JOIN quiz_questions q ON q.id = qa.question_id
     LEFT JOIN quiz_options sel ON sel.id = qa.selected_option_id
     LEFT JOIN LATERAL (
       SELECT id, option_text
       FROM quiz_options qo
       WHERE qo.question_id = q.id
         AND qo.is_correct = true
       LIMIT 1
     ) corr ON true
     WHERE qs.user_id = $1
       AND qs.id = $2
       AND qs.completed_at IS NOT NULL
     ORDER BY qa.id ASC`,
    [userId, sessionId]
  );

  if (result.rows.length === 0) {
    throw new Error('Quiz session not found');
  }

  const rows = result.rows as ReviewRow[];
  const questionIds = Array.from(new Set(rows.map((row) => row.question_id)));
  const optionsResult = await pool.query(
    `SELECT question_id, id, option_text
     FROM quiz_options
     WHERE question_id = ANY($1::int[])
     ORDER BY question_id, id`,
    [questionIds]
  );

  const optionsByQuestion = new Map<number, QuizOption[]>();
  for (const row of optionsResult.rows) {
    const questionId = Number(row.question_id);
    const options = optionsByQuestion.get(questionId) || [];
    options.push({
      id: Number(row.id),
      option_text: row.option_text,
    });
    optionsByQuestion.set(questionId, options);
  }

  const first = rows[0];
  return {
    sessionId: first.session_id,
    sessionType: first.session_type,
    completedAt: first.completed_at,
    totalScore: roundToTwo(Number(first.total_score || 0)),
    passed: Boolean(first.passed),
    questions: rows.map((row) => ({
      questionId: row.question_id,
      questionText: row.question_text,
      questionType: row.question_type,
      selectedOptionId: row.selected_option_id,
      correctOptionId: row.correct_option_id,
      selectedOptionText: row.selected_option_text,
      correctOptionText: row.correct_option_text,
      isCorrect: Boolean(row.is_correct),
      options: optionsByQuestion.get(row.question_id) || [],
    })),
  };
}

export async function redoQuizSession(userId: number, sourceSessionId: number): Promise<QuizSessionPayload> {
  const sessionResult = await pool.query(
    `SELECT id, session_type
     FROM quiz_sessions
     WHERE id = $1
       AND user_id = $2
       AND completed_at IS NOT NULL`,
    [sourceSessionId, userId]
  );

  if (sessionResult.rows.length === 0) {
    throw new Error('Quiz session not found');
  }

  const sessionType = sessionResult.rows[0].session_type as 'weekly' | 'monthly';
  const questionIdResult = await pool.query(
    `SELECT DISTINCT question_id
     FROM quiz_attempts
     WHERE user_id = $1
       AND session_id = $2
     ORDER BY question_id ASC`,
    [userId, sourceSessionId]
  );

  if (questionIdResult.rows.length === 0) {
    throw new Error('No quiz questions found for this session');
  }

  const questionIds = questionIdResult.rows.map((row) => Number(row.question_id));
  const sessionId = await createQuizSession(userId, sessionType);

  const rows = await pool.query(
    `SELECT
       q.id,
       q.question_text,
       q.question_type,
       qo.id AS option_id,
       qo.option_text
     FROM quiz_questions q
     JOIN quiz_options qo ON qo.question_id = q.id
     WHERE q.id = ANY($1::int[])
     ORDER BY q.id, qo.id`,
    [questionIds]
  );

  const grouped = new Map<number, QuizQuestionForClient>();
  for (const row of rows.rows) {
    const questionId = Number(row.id);
    if (!grouped.has(questionId)) {
      grouped.set(questionId, {
        id: questionId,
        question_text: row.question_text,
        question_type: row.question_type,
        options: [],
      });
    }

    grouped.get(questionId)?.options.push({
      id: Number(row.option_id),
      option_text: row.option_text,
    });
  }

  const questionMap = new Map(Array.from(grouped.entries()));
  const questions = questionIds
    .map((id) => questionMap.get(id))
    .filter((item): item is QuizQuestionForClient => Boolean(item));

  return {
    sessionId,
    questions,
  };
}
