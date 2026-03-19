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

const PASSING_SCORE = 70;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

async function seedDefaultQuestion(client: PoolClient): Promise<void> {
  const insertedQuestion = await client.query(
    `INSERT INTO quiz_questions (question_text, question_type, topic_category, difficulty_level, weight)
     VALUES ($1, 'multiple_choice', 'phishing', 'basic', 1)
     RETURNING id`,
    ['What is the safest first action when you receive a suspicious email?']
  );

  const questionId = insertedQuestion.rows[0].id as number;

  await client.query(
    `INSERT INTO quiz_options (question_id, option_text, is_correct, feedback_on_select)
     VALUES
       ($1, 'Check sender address and links before clicking anything', true, 'Correct: verify sender and links first.'),
       ($1, 'Open attachments immediately to inspect the file', false, 'Unsafe: attachments can contain malware.'),
       ($1, 'Reply with personal details to confirm your identity', false, 'Unsafe: never share personal data by reply.'),
       ($1, 'Forward to contacts to ask if they received it', false, 'Not ideal: verify safely and report internally first.')`,
    [questionId]
  );
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
     WHERE q.question_type = 'multiple_choice'
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

  return Array.from(grouped.values()).slice(0, limit);
}

async function ensureQuestionsExist(): Promise<void> {
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM quiz_questions');
  if (result.rows[0].count > 0) {
    return;
  }

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
        `INSERT INTO quiz_attempts (user_id, question_id, selected_option_id, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [userId, answer.questionId, answer.selectedOptionId, isCorrect]
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
