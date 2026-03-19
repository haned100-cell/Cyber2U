import {
  createEmailVerification,
  createSession,
  findOrCreateUser,
  generateSessionToken,
  verifyEmailToken,
} from './auth.service';
import { getQuizSessionPayload, submitQuizSession } from './scoring.service';
import { recalculateProgressSnapshot } from './progress.service';

export interface DemoBootstrapResult {
  token: string;
  userId: number;
  email: string;
  completedSessions: number;
}

function buildAnswersFromPayload(payload: {
  questions: Array<{ id: number; options: Array<{ id: number }> }>;
}): Record<string, number> {
  const answers: Record<string, number> = {};

  for (const question of payload.questions) {
    if (question.options.length > 0) {
      // Select first option consistently for deterministic demo runs.
      answers[String(question.id)] = question.options[0].id;
    }
  }

  return answers;
}

export async function bootstrapDemoUser(emailInput?: string): Promise<DemoBootstrapResult> {
  const email = (emailInput || 'demo.user@cyber2u.local').toLowerCase().trim();
  const user = await findOrCreateUser(email);

  const verificationToken = await createEmailVerification(user.id);
  await verifyEmailToken(verificationToken);

  const completedSessions = 3;

  for (let i = 0; i < completedSessions; i += 1) {
    const payload = await getQuizSessionPayload(user.id, 'weekly', 5);
    const answers = buildAnswersFromPayload(payload);
    await submitQuizSession(user.id, payload.sessionId, answers);
  }

  await recalculateProgressSnapshot(user.id);

  const sessionToken = generateSessionToken(user.id);
  await createSession(user.id, sessionToken);

  return {
    token: sessionToken,
    userId: user.id,
    email,
    completedSessions,
  };
}
