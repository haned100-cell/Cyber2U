import { pool } from '../db';

export interface FeedbackInput {
  userId: number;
  journeyLabel: string;
  journeyVariant: string;
  usabilityRating: number;
  contentClarityRating: number;
  confidenceImprovementRating: number;
  recommendationRating: number;
  mostValuableFeature: string;
  biggestPainPoint?: string;
  suggestedImprovement?: string;
  wouldContinue: boolean;
  screenshots: string[];
}

export interface FeedbackResponse {
  id: number;
  user_id: number;
  journey_label: string;
  journey_variant: string;
  usability_rating: number;
  content_clarity_rating: number;
  confidence_improvement_rating: number;
  recommendation_rating: number;
  most_valuable_feature: string;
  biggest_pain_point: string | null;
  suggested_improvement: string | null;
  would_continue: boolean;
  screenshots: string[];
  created_at: string;
}

export async function createFeedbackResponse(input: FeedbackInput): Promise<FeedbackResponse> {
  const result = await pool.query(
    `INSERT INTO user_feedback_responses (
      user_id,
      journey_label,
      journey_variant,
      usability_rating,
      content_clarity_rating,
      confidence_improvement_rating,
      recommendation_rating,
      most_valuable_feature,
      biggest_pain_point,
      suggested_improvement,
      would_continue,
      screenshots
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
    RETURNING *`,
    [
      input.userId,
      input.journeyLabel,
      input.journeyVariant,
      input.usabilityRating,
      input.contentClarityRating,
      input.confidenceImprovementRating,
      input.recommendationRating,
      input.mostValuableFeature,
      input.biggestPainPoint || null,
      input.suggestedImprovement || null,
      input.wouldContinue,
      JSON.stringify(input.screenshots),
    ]
  );

  return result.rows[0];
}

export async function listFeedbackResponsesByUser(userId: number): Promise<FeedbackResponse[]> {
  const result = await pool.query(
    `SELECT *
     FROM user_feedback_responses
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function listAllFeedbackResponses(limit = 200): Promise<FeedbackResponse[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const result = await pool.query(
    `SELECT *
     FROM user_feedback_responses
     ORDER BY created_at DESC
     LIMIT $1`,
    [safeLimit]
  );

  return result.rows;
}
