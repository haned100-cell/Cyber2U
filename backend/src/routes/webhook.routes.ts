import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db';
import { createAuditLog } from '../services/auth.service';

const router = Router();

/**
 * POST /api/webhook/formsubmit
 * Receive form submissions from formsubmit.co
 */
router.post('/formsubmit', async (req: Request, res: Response) => {
  try {
    const { email, source } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    // Log the formsubmit webhook
    console.log(`FormSubmit webhook received: ${email} from ${source || 'unknown'}`);

    // TODO: Implement formsubmit integration logic
    // For now, just acknowledge receipt
    res.json({ message: 'Received and queued for processing' });
  } catch (error) {
    console.error('Formsubmit webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
