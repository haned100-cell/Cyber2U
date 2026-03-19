import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://backend:3000';
const mailhogUrl = process.env.MAILHOG_URL || 'http://mailhog:8025';
const maxAttempts = Number(process.env.POLL_ATTEMPTS || '20');
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || '1500');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(url, label) {
  for (let i = 1; i <= maxAttempts; i += 1) {
    try {
      await axios.get(url, { timeout: 3000 });
      console.log(`[sim-user] ${label} is ready`);
      return;
    } catch (error) {
      console.log(`[sim-user] waiting for ${label} (${i}/${maxAttempts})`);
      await delay(pollIntervalMs);
    }
  }

  throw new Error(`${label} did not become ready`);
}

function extractTokenFromMail(item) {
  const blob = JSON.stringify(item);
  const match = blob.match(/\/verify\?token=([a-f0-9]{20,})/i);
  return match ? match[1] : null;
}

async function pollForVerificationEmail(targetEmail) {
  for (let i = 1; i <= maxAttempts; i += 1) {
    const response = await axios.get(`${mailhogUrl}/api/v2/messages`, { timeout: 5000 });
    const items = response.data?.items || [];

    const hit = items.find((item) => {
      const blob = JSON.stringify(item).toLowerCase();
      return blob.includes(targetEmail.toLowerCase()) && blob.includes('verify your email - cyber2you');
    });

    if (hit) {
      console.log('[sim-user] verification email found in inbox');
      const token = extractTokenFromMail(hit);
      if (!token) {
        throw new Error('Email found but token could not be extracted');
      }
      return token;
    }

    console.log(`[sim-user] polling inbox (${i}/${maxAttempts})`);
    await delay(pollIntervalMs);
  }

  throw new Error('Verification email not found in MailHog inbox');
}

async function main() {
  const suffix = Date.now();
  const email = `sim.user.${suffix}@cyber2u.local`;

  await waitFor(`${backendUrl}/health`, 'backend');
  await waitFor(`${mailhogUrl}/api/v2/messages`, 'mailhog');

  console.log(`[sim-user] signing up as ${email}`);
  await axios.post(`${backendUrl}/api/auth/request-magic-link`, { email }, { timeout: 8000 });
  console.log('[sim-user] signup request submitted');

  const token = await pollForVerificationEmail(email);
  console.log(`[sim-user] token extracted (${token.slice(0, 8)}...)`);

  const verifyResponse = await axios.post(
    `${backendUrl}/api/auth/verify`,
    { token },
    { timeout: 8000 }
  );

  const authToken = verifyResponse.data?.token;
  if (!authToken) {
    throw new Error('Verification succeeded but auth token missing');
  }

  console.log('[sim-user] account verified and auth token received');

  const profile = await axios.get(`${backendUrl}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${authToken}` },
    timeout: 8000,
  });

  console.log('[sim-user] profile fetched:', profile.data);
  console.log('[sim-user] flow complete');
}

main().catch((error) => {
  console.error('[sim-user] flow failed:', error.message || error);
  process.exit(1);
});
