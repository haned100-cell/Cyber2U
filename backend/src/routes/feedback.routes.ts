import { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { createAuditLog } from '../services/auth.service';
import {
  createFeedbackResponse,
  listAllFeedbackResponses,
  listFeedbackResponsesByUser,
} from '../services/feedback.service';

const router = Router();

function asBoundedInteger(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  const parsed = Math.round(value);
  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      journeyLabel,
      journeyVariant,
      usabilityRating,
      contentClarityRating,
      confidenceImprovementRating,
      recommendationRating,
      mostValuableFeature,
      biggestPainPoint,
      suggestedImprovement,
      wouldContinue,
      screenshots,
    } = req.body || {};

    const validatedUsability = asBoundedInteger(usabilityRating, 1, 5);
    const validatedClarity = asBoundedInteger(contentClarityRating, 1, 5);
    const validatedConfidence = asBoundedInteger(confidenceImprovementRating, 1, 5);
    const validatedRecommendation = asBoundedInteger(recommendationRating, 1, 10);

    if (
      typeof journeyLabel !== 'string' ||
      journeyLabel.trim().length === 0 ||
      typeof journeyVariant !== 'string' ||
      journeyVariant.trim().length === 0 ||
      !validatedUsability ||
      !validatedClarity ||
      !validatedConfidence ||
      !validatedRecommendation ||
      typeof mostValuableFeature !== 'string' ||
      mostValuableFeature.trim().length === 0
    ) {
      res.status(400).json({ error: 'Feedback payload is missing one or more required fields' });
      return;
    }

    const sanitizedScreenshots = Array.isArray(screenshots)
      ? screenshots.filter((item): item is string => typeof item === 'string').slice(0, 10)
      : [];

    const response = await createFeedbackResponse({
      userId: req.userId!,
      journeyLabel: journeyLabel.trim().slice(0, 120),
      journeyVariant: journeyVariant.trim().slice(0, 40),
      usabilityRating: validatedUsability,
      contentClarityRating: validatedClarity,
      confidenceImprovementRating: validatedConfidence,
      recommendationRating: validatedRecommendation,
      mostValuableFeature: mostValuableFeature.trim().slice(0, 4000),
      biggestPainPoint:
        typeof biggestPainPoint === 'string' ? biggestPainPoint.trim().slice(0, 4000) : undefined,
      suggestedImprovement:
        typeof suggestedImprovement === 'string' ? suggestedImprovement.trim().slice(0, 4000) : undefined,
      wouldContinue: Boolean(wouldContinue),
      screenshots: sanitizedScreenshots,
    });

    await createAuditLog(
      req.userId ?? null,
      'feedback_submitted',
      'user_feedback_responses',
      response.id,
      null,
      {
        journeyLabel: response.journey_label,
        journeyVariant: response.journey_variant,
        recommendationRating: response.recommendation_rating,
      },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({ response });
  } catch (error) {
    console.error('Feedback create error:', error);
    res.status(500).json({ error: 'Failed to submit feedback response' });
  }
});

router.get('/mine', authenticateToken, async (req: Request, res: Response) => {
  try {
    const responses = await listFeedbackResponsesByUser(req.userId!);
    res.json({ responses });
  } catch (error) {
    console.error('Feedback list error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback responses' });
  }
});

router.get('/study-export', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRoleHeader = req.header('x-cyber2u-role');
    if (userRoleHeader !== 'admin') {
      res.status(403).json({ error: 'Admin role required for study export' });
      return;
    }

    const limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 200;
    const responses = await listAllFeedbackResponses(limit);
    res.json({ responses });
  } catch (error) {
    console.error('Feedback export error:', error);
    res.status(500).json({ error: 'Failed to export feedback responses' });
  }
});

export default router;
