import { Router, Request, Response } from 'express';
import {
  findOrCreateUser,
  createEmailVerification,
  verifyEmailToken,
  generateSessionToken,
  createSession,
  getUserById,
  recordConsent,
  createAuditLog,
} from '../services/auth.service';
import { sendEmail, generateMagicLinkEmail, sendWelcomeEmail } from '../services/email.service';
import { authenticateToken } from '../middleware/auth';
import config from '../config';

const router = Router();

/**
 * POST /api/auth/request-magic-link
 * Request a magic link to be sent to email
 */
router.post('/request-magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email required' });
      return;
    }

    // Find or create user
    const user = await findOrCreateUser(email);

    // Create verification token
    const token = await createEmailVerification(user.id);

    // Generate magic link
    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    const magicLink = `${baseUrl}/verify?token=${token}`;

    // Send email
    const { html, text } = generateMagicLinkEmail(magicLink, email);
    await sendEmail({
      to: email,
      subject: 'Verify your email - Cyber2You',
      html,
      text,
    });

    // Log action
    await createAuditLog(
      null,
      'magic_link_requested',
      'user',
      user.id,
      null,
      { email },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Check your email for the verification link' });
  } catch (error) {
    console.error('Magic link request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * POST /api/auth/verify
 * Verify magic link token and create session
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    // Verify token
    const user = await verifyEmailToken(token);

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Record GDPR consent (implicit from signup verification)
    await recordConsent(user.id, 'marketing_emails', req.ip, req.headers['user-agent']);
    await recordConsent(user.id, 'data_collection', req.ip, req.headers['user-agent']);

    // Generate session token
    const sessionToken = generateSessionToken(user.id);
    await createSession(user.id, sessionToken);

    // Send welcome email
    await sendWelcomeEmail(user.email);

    // Log action
    await createAuditLog(
      user.id,
      'email_verified',
      'user',
      user.id,
      null,
      { verified: true },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      token: sessionToken,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // In real implementation, would soft-delete or mark session as revoked
    await createAuditLog(
      req.userId,
      'logout',
      'session',
      undefined,
      null,
      { loggedOut: true },
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/profile
 * Get authenticated user profile
 */
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.userId!);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
