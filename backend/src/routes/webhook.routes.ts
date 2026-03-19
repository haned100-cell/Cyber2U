import { Router, Request, Response } from 'express';
import {
  findOrCreateUser,
  createEmailVerification,
  createAuditLog,
} from '../services/auth.service';
import { sendEmail, generateMagicLinkEmail } from '../services/email.service';
import config from '../config';

const router = Router();

function extractEmail(payload: Record<string, unknown>): string | null {
  const candidates = ['email', 'Email', 'user_email', 'mail'];

  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().includes('@')) {
      return value.toLowerCase().trim();
    }
  }

  return null;
}

function isSpamPayload(payload: Record<string, unknown>): boolean {
  // Optional honeypot field support for forms
  const honey = payload._honey;
  return typeof honey === 'string' && honey.trim().length > 0;
}

/**
 * POST /api/webhook/formsubmit
 * Receive form submissions from formsubmit.co
 */
router.post('/formsubmit', async (req: Request, res: Response) => {
  try {
    const payload = req.body as Record<string, unknown>;

    // Optional webhook token check for extra protection.
    const configuredToken = process.env.FORMSUBMIT_WEBHOOK_TOKEN;
    if (configuredToken) {
      const providedToken = req.header('x-cyber2u-webhook-token') || String(payload.webhookToken || '');
      if (providedToken !== configuredToken) {
        res.status(401).json({ error: 'Invalid webhook token' });
        return;
      }
    }

    if (isSpamPayload(payload)) {
      res.status(202).json({ message: 'Accepted' });
      return;
    }

    const email = extractEmail(payload);
    const source = typeof payload.source === 'string' ? payload.source : 'formsubmit';

    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    // Find or create user and issue a fresh verification token.
    const user = await findOrCreateUser(email);
    const token = await createEmailVerification(user.id);

    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    const magicLink = `${baseUrl}/verify?token=${token}`;
    const { html, text } = generateMagicLinkEmail(magicLink, email);

    await sendEmail({
      to: email,
      subject: 'Verify your email - Cyber2You',
      html,
      text,
    });

    await createAuditLog(
      user.id,
      'formsubmit_signup_received',
      'user',
      user.id,
      null,
      {
        source,
        formsubmitEndpoint: config.formsubmit.endpoint,
      },
      req.ip,
      req.headers['user-agent']
    );

    console.log(`FormSubmit webhook processed for ${email} from ${source}`);

    res.status(202).json({ message: 'Signup accepted and verification email sent' });
  } catch (error) {
    console.error('Formsubmit webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
