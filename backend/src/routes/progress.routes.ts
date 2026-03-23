import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getLatestProgress,
  getProgressTimeline,
  getTopicScoreHistory,
  getTopicMastery,
  recalculateProgressSnapshot,
} from '../services/progress.service';

const router = Router();

/**
 * GET /api/progress
 * Get user's progress summary
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    let progress = await getLatestProgress(req.userId!);

    // Auto-refresh snapshot when the user has historical attempts but no snapshot yet.
    if (progress.totalQuizzesCompleted === 0) {
      progress = await recalculateProgressSnapshot(req.userId!);
    }

    res.json(progress);
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

/**
 * GET /api/progress/timeline
 * Get progress over time
 */
router.get('/timeline', authenticateToken, async (req: Request, res: Response) => {
  try {
    const timeline = await getProgressTimeline(req.userId!);
    res.json({ timeline });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

/**
 * GET /api/progress/topics
 * Get topic-level mastery
 */
router.get('/topics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const topicScores = await getTopicMastery(req.userId!);
    res.json({ topicScores });
  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

/**
 * GET /api/progress/topic-history
 * Get session-by-session score progression per topic
 */
router.get('/topic-history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const history = await getTopicScoreHistory(req.userId!);
    res.json({ history });
  } catch (error) {
    console.error('Topic history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch topic history' });
  }
});

export default router;
