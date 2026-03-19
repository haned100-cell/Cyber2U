import { pool } from '../db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';

export interface User {
  id: number;
  email: string;
  created_at: string;
  is_active: boolean;
}

/**
 * Find or create a user by email
 */
export async function findOrCreateUser(email: string): Promise<User> {
  const normalized = email.toLowerCase().trim();

  // Try to find existing user
  const existing = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [normalized]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Create new user
  const result = await pool.query(
    'INSERT INTO users (email) VALUES ($1) RETURNING *',
    [normalized]
  );

  return result.rows[0];
}

/**
 * Create a magic link token for user
 */
export async function createEmailVerification(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

  await pool.query(
    `INSERT INTO email_verifications (user_id, token, expires_at) 
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  );

  return token;
}

/**
 * Verify a magic link token and mark user as verified
 */
export async function verifyEmailToken(token: string): Promise<User | null> {
  const result = await pool.query(
    `SELECT ev.user_id, u.* FROM email_verifications ev
     JOIN users u ON ev.user_id = u.id
     WHERE ev.token = $1 
     AND ev.verified_at IS NULL
     AND ev.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  // Mark as verified
  await pool.query(
    'UPDATE email_verifications SET verified_at = NOW() WHERE user_id = $1',
    [user.id]
  );

  return user;
}

/**
 * Create a session token for user
 */
export function generateSessionToken(userId: number): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Store session in database
 */
export async function createSession(userId: number, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 day session

  await pool.query(
    `INSERT INTO sessions (user_id, token, expires_at) 
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Mark user consent
 */
export async function recordConsent(
  userId: number,
  consentType: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO user_consents (user_id, consent_type, ip_address, user_agent) 
     VALUES ($1, $2, $3, $4)`,
    [userId, consentType, ipAddress, userAgent]
  );
}

/**
 * Add audit log entry
 */
export async function createAuditLog(
  userId: number | null,
  action: string,
  resourceType: string,
  resourceId?: number,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, action, resourceType, resourceId, oldValues, newValues, ipAddress, userAgent]
  );
}
