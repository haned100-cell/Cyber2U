import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

/**
 * GET /api/quiz/weekly
 * Get current week's mini-quiz
 */
router.get('/weekly', authenticateToken, async (req: Request, res: Response) => {
  try {
    // TODO: Implement quiz retrieval logic
    // For now, return empty quiz
    const mockQuiz = {
      sessionId: 1,
      questions: [
        {
          id: 1,
          question_text: 'What is the first step in recognizing a phishing email?',
          question_type: 'multiple_choice',
          options: [
            { id: 1, option_text: 'Check the sender email address carefully' },
            { id: 2, option_text: 'Click the link to verify' },
            { id: 3, option_text: 'Forward to everyone you know' },
            { id: 4, option_text: 'Ask your manager' },
          ],
        },
      ],
    };

    res.json(mockQuiz);
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
    // TODO: Implement monthly assessment retrieval
    res.status(501).json({ error: 'Not yet implemented' });
  } catch (error) {
    console.error('Monthly quiz fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

/**
 * POST /api/quiz/:sessionId/submit
 * Submit quiz answers and get score
 */
router.post('/:sessionId/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const { sessionId } = req.params;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ error: 'Invalid answers format' });
      return;
    }

    // TODO: Implement server-side scoring
    // For now, return mock score
    const score = Math.round(Math.random() * 100);

    res.json({
      score,
      passed: score >= 70,
      feedback: 'Quiz submitted successfully.',
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
