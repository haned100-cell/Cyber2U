import { test, expect, APIRequestContext } from '@playwright/test';

test.use({ video: 'on' });

const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3000';
const mailhogBaseUrl = process.env.MAILHOG_BASE_URL || 'http://127.0.0.1:8025';

async function pollForDemoQuizEmail(request: APIRequestContext, recipientEmail: string): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    const response = await request.get(`${mailhogBaseUrl}/api/v2/messages`);
    if (response.ok()) {
      const body = await response.json();
      const items: unknown[] = body.items || [];
      const found = items.some((item) => {
        const raw = JSON.stringify(item).toLowerCase();
        return raw.includes(recipientEmail.toLowerCase()) && raw.includes('cyber2u weekly quiz: spot the phish');
      });

      if (found) {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for quiz email in MailHog for ${recipientEmail}`);
}

async function assertQuizContentInMailhogApi(request: APIRequestContext, recipientEmail: string): Promise<void> {
  const response = await request.get(`${mailhogBaseUrl}/api/v2/messages`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const items: unknown[] = body.items || [];

  const target = items.find((item) => {
    const raw = JSON.stringify(item).toLowerCase();
    return raw.includes(recipientEmail.toLowerCase()) && raw.includes('cyber2u weekly quiz: spot the phish');
  });

  expect(target).toBeTruthy();
  const serialized = JSON.stringify(target);
  expect(serialized).toContain('Weekly Cyber2U Quiz');
  expect(serialized).toContain('What is the safest response to an urgent');
  expect(serialized).toContain('password reset email you did not request?');
  expect(serialized).toContain('Open Interactive Quiz');
}

test.describe('Cyber2U Walkthrough Video', () => {
  test('setup to user testing and visualisation flow', async ({ page, request }) => {
    test.setTimeout(180000);

    // 1) Landing page
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Join Cyber2You' })).toBeVisible();
    await page.waitForTimeout(1200);

    // 2) Bootstrap seeded demo user
    await page.goto('/demo-user');
    await expect(page.getByText(/Demo user ready|Bootstrapping demo user/i)).toBeVisible();
    await expect(page.getByText(/Could not create demo user data/i)).toHaveCount(0);
    await page.waitForTimeout(1800);

    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(authToken).toBeTruthy();

    const profileResponse = await request.get(`${backendBaseUrl}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();
    const recipientEmail = profile.email as string;

    // Trigger a real service email that contains a quiz snippet.
    const sendDemoQuizResponse = await request.post(`${backendBaseUrl}/api/auth/send-demo-quiz-email`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(sendDemoQuizResponse.ok()).toBeTruthy();

    // 3) Dashboard visualisation
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Your Cyber Literacy Journey' })).toBeVisible();
    await expect(page.getByText(/Quizzes Completed/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Customize Your Cybersecurity Interests' })).toBeVisible();
    await page.waitForTimeout(600);

    // 3a) Interest customization
    await page.getByLabel('Ransomware').check();
    await page.getByLabel('Data Privacy').check();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Save Interest Areas' }).click();
    await expect(page.getByText(/Saved your cybersecurity interest areas/i)).toBeVisible();
    await page.waitForTimeout(1400);

    // 4) Quiz interaction
    await page.goto('/quiz');
    await expect(page.getByText(/Question 1 of/i)).toBeVisible();
    await page.waitForTimeout(800);

    const firstOption = page.locator('.quiz-options input[type="radio"]').first();
    await firstOption.check();
    await page.waitForTimeout(500);

    const submitButton = page.getByRole('button', { name: 'Submit Quiz' });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await expect(page.getByRole('heading', { name: 'Quiz Complete!' })).toBeVisible();
    } else {
      const nextButton = page.getByRole('button', { name: 'Next' });
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      await page.getByRole('button', { name: 'Submit Quiz' }).click();
      await expect(page.getByRole('heading', { name: 'Quiz Complete!' })).toBeVisible();
    }
    await page.waitForTimeout(1200);

    // 5) Updated dashboard
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Your Cyber Literacy Journey' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Customize Your Cybersecurity Interests' })).toBeVisible();
    await expect(page.getByLabel('Ransomware')).toBeChecked();
    await expect(page.getByLabel('Data Privacy')).toBeChecked();
    await page.waitForTimeout(1200);

    // 6) MailHog inbox visualisation with delivered quiz email
    await pollForDemoQuizEmail(request, recipientEmail);
    await assertQuizContentInMailhogApi(request, recipientEmail);

    await page.goto(`${mailhogBaseUrl}/`);
    await expect(page.getByRole('link', { name: /MailHog/ })).toBeVisible();

    for (let i = 0; i < 10; i += 1) {
      if (await page.getByText(recipientEmail).first().isVisible().catch(() => false)) {
        break;
      }
      await page.reload();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(recipientEmail).first()).toBeVisible();
    await page.getByText(recipientEmail).first().click();

    await expect(page.getByText(/Cyber2U Weekly Quiz: Spot the Phish/i).first()).toBeVisible();
    await page.waitForTimeout(1800);
  });
});
