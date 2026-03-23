import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCompletedQuizHistory,
  getQuizSessionPayload,
  getQuizSessionReview,
  redoQuizSession,
  submitQuizSession,
} from '../services/scoring.service';
import { recalculateProgressSnapshot } from '../services/progress.service';

const router = Router();

/**
 * GET /api/quiz/weekly
 * Get current week's mini-quiz
 */
router.get('/weekly', authenticateToken, async (req: Request, res: Response) => {
  try {
    const payload = await getQuizSessionPayload(req.userId!, 'weekly', 5);
    res.json(payload);
  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * GET /api/quiz/monthly
 * Get monthly assessment quiz
 */
router.get('/monthly', authenticateToken, async (req: Request, res: Response) => {
  try {
    const payload = await getQuizSessionPayload(req.userId!, 'monthly', 10);
    res.json(payload);
  } catch (error) {
    console.error('Monthly quiz fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * GET /api/quiz/history
 * Get completed quiz sessions for the current user
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessions = await getCompletedQuizHistory(req.userId!);
    res.json({ sessions });
  } catch (error) {
    console.error('Quiz history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

/**
 * GET /api/quiz/:sessionId/review
 * Get full review payload (answers + correct options) for a past session
 */
router.get('/:sessionId/review', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(400).json({ error: 'Invalid session id' });
      return;
    }

    const payload = await getQuizSessionReview(req.userId!, sessionId);
    res.json(payload);
  } catch (error) {
    if (error instanceof Error && /not found/.test(error.message)) {
      res.status(404).json({ error: error.message });
      return;
    }

    console.error('Quiz review fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz review' });
  }
});

/**
 * POST /api/quiz/:sessionId/redo
 * Create a new session that reuses the question set from a past session
 */
router.post('/:sessionId/redo', authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(400).json({ error: 'Invalid session id' });
      return;
    }

    const payload = await redoQuizSession(req.userId!, sessionId);
    res.json(payload);
  } catch (error) {
    if (error instanceof Error && /not found|No quiz questions/.test(error.message)) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error('Quiz redo error:', error);
    res.status(500).json({ error: 'Failed to create redo quiz session' });
  }
});

/**
 * POST /api/quiz/:sessionId/submit
 * Submit quiz answers and get score
 */
router.post('/:sessionId/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const sessionId = Number(req.params.sessionId);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      res.status(400).json({ error: 'Invalid session id' });
      return;
    }

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'Invalid answers format' });
      return;
    }

    const result = await submitQuizSession(req.userId!, sessionId, answers as Record<string, unknown>);
    const progress = await recalculateProgressSnapshot(req.userId!);

    res.json({
      ...result,
      progress,
      feedback: 'Quiz submitted and progress updated.',
    });
  } catch (error) {
    if (error instanceof Error && /not found|already submitted|No valid answers|Invalid/.test(error.message)) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
