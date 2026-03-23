import { pool } from '../db';

export interface ProgressSnapshot {
  totalQuizzesCompleted: number;
  averageScore: number;
  improvementPercentage: number;
  topicScores: Record<string, number>;
}

export interface TopicScoreHistoryPoint {
  sessionId: number;
  completedAt: string;
  totalScore: number;
  topicScores: Record<string, number>;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function currentMonthYear(): string {
  return new Date().toISOString().slice(0, 7);
}

export async function recalculateProgressSnapshot(userId: number): Promise<ProgressSnapshot> {
  const summary = await pool.query(
    `SELECT
       COUNT(*)::int AS completed_count,
       COALESCE(SUM(total_score), 0)::float AS total_score,
       COALESCE(AVG(total_score), 0)::float AS average_score,
       COALESCE(MIN(total_score), 0)::float AS baseline_score
     FROM quiz_sessions
     WHERE user_id = $1
       AND completed_at IS NOT NULL
       AND total_score IS NOT NULL`,
    [userId]
  );

  const row = summary.rows[0];
  const completedCount = row.completed_count as number;
  const totalScore = roundToTwo(row.total_score as number);
  const averageScore = roundToTwo(row.average_score as number);
  const baselineScore = roundToTwo(row.baseline_score as number);

  const improvementPercentage = baselineScore > 0
    ? roundToTwo(((averageScore - baselineScore) / baselineScore) * 100)
    : 0;

  const topicRows = await pool.query(
    `SELECT
       COALESCE(q.topic_category, 'general') AS topic,
       COALESCE(
         SUM(CASE WHEN qa.is_correct THEN COALESCE(q.weight, 1) ELSE 0 END)::float
         / NULLIF(SUM(COALESCE(q.weight, 1)), 0),
         0
       ) AS mastery
     FROM quiz_attempts qa
     JOIN quiz_questions q ON q.id = qa.question_id
     WHERE qa.user_id = $1
     GROUP BY COALESCE(q.topic_category, 'general')`,
    [userId]
  );

  const topicScores: Record<string, number> = {};
  for (const topicRow of topicRows.rows) {
    topicScores[topicRow.topic] = roundToTwo(Number(topicRow.mastery));
  }

  await pool.query(
    `INSERT INTO user_progress_snapshots (
       user_id,
       total_quizzes_completed,
       total_score,
       average_score,
       baseline_score,
       improvement_percentage,
       topic_scores,
       month_year
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      userId,
      completedCount,
      totalScore,
      averageScore,
      baselineScore,
      improvementPercentage,
      JSON.stringify(topicScores),
      currentMonthYear(),
    ]
  );

  return {
    totalQuizzesCompleted: completedCount,
    averageScore,
    improvementPercentage,
    topicScores,
  };
}

export async function getLatestProgress(userId: number): Promise<ProgressSnapshot> {
  const latest = await pool.query(
    `SELECT
       total_quizzes_completed,
       average_score,
       improvement_percentage,
       topic_scores
     FROM user_progress_snapshots
     WHERE user_id = $1
     ORDER BY last_updated_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );

  if (latest.rows.length === 0) {
    return {
      totalQuizzesCompleted: 0,
      averageScore: 0,
      improvementPercentage: 0,
      topicScores: {},
    };
  }

  const row = latest.rows[0];
  return {
    totalQuizzesCompleted: row.total_quizzes_completed,
    averageScore: Number(row.average_score || 0),
    improvementPercentage: Number(row.improvement_percentage || 0),
    topicScores: (row.topic_scores || {}) as Record<string, number>,
  };
}

export async function getProgressTimeline(userId: number): Promise<Array<{ monthYear: string; averageScore: number; improvementPercentage: number }>> {
  const result = await pool.query(
    `SELECT month_year, average_score, improvement_percentage
     FROM user_progress_snapshots
     WHERE user_id = $1
     ORDER BY month_year ASC, id ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    monthYear: row.month_year,
    averageScore: Number(row.average_score || 0),
    improvementPercentage: Number(row.improvement_percentage || 0),
  }));
}

export async function getTopicMastery(userId: number): Promise<Record<string, number>> {
  const latest = await getLatestProgress(userId);
  return latest.topicScores;
}

export async function getTopicScoreHistory(userId: number): Promise<TopicScoreHistoryPoint[]> {
  const result = await pool.query(
    `SELECT
       qs.id AS session_id,
       qs.completed_at,
       COALESCE(qs.total_score, 0)::float AS total_score,
       COALESCE(
         jsonb_object_agg(ts.topic, ts.mastery)
           FILTER (WHERE ts.topic IS NOT NULL),
         '{}'::jsonb
       ) AS topic_scores
     FROM quiz_sessions qs
     LEFT JOIN (
       SELECT
         qa.session_id,
         COALESCE(q.topic_category, 'general') AS topic,
         ROUND(
           COALESCE(
             SUM(CASE WHEN qa.is_correct THEN COALESCE(q.weight, 1) ELSE 0 END)::numeric
             / NULLIF(SUM(COALESCE(q.weight, 1))::numeric, 0),
             0
           ) * 100,
           2
         ) AS mastery
       FROM quiz_attempts qa
       JOIN quiz_questions q ON q.id = qa.question_id
       WHERE qa.user_id = $1
         AND qa.session_id IS NOT NULL
       GROUP BY qa.session_id, COALESCE(q.topic_category, 'general')
     ) ts ON ts.session_id = qs.id
     WHERE qs.user_id = $1
       AND qs.completed_at IS NOT NULL
     GROUP BY qs.id
     ORDER BY qs.completed_at ASC`,
    [userId]
  );

  return result.rows.map((row) => ({
    sessionId: Number(row.session_id),
    completedAt: row.completed_at,
    totalScore: Number(row.total_score || 0),
    topicScores: row.topic_scores || {},
  }));
}
