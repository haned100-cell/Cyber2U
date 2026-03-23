import { test, expect, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotDir = path.resolve(process.cwd(), '../docs/screenshots');
const backendBaseUrl = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:3000';
const mailhogBaseUrl = process.env.MAILHOG_BASE_URL || 'http://127.0.0.1:8025';

function screenshotPath(filename: string): string {
  fs.mkdirSync(screenshotDir, { recursive: true });
  return path.join(screenshotDir, filename);
}

async function waitForApi(request: APIRequestContext, url: string, attempts = 20): Promise<void> {
  for (let i = 1; i <= attempts; i += 1) {
    const response = await request.get(url);
    if (response.ok()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`API unavailable: ${url}`);
}

async function pollForMail(
  request: APIRequestContext,
  email: string,
  attempts = 30
): Promise<void> {
  for (let i = 1; i <= attempts; i += 1) {
    const response = await request.get(`${mailhogBaseUrl}/api/v2/messages`);
    if (response.ok()) {
      const body = await response.json();
      const items: unknown[] = body.items || [];
      const hit = items.find((item) => JSON.stringify(item).toLowerCase().includes(email.toLowerCase()));
      if (hit) {
        return;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`No email found in MailHog for ${email}`);
}

test.describe('MailHog Inbox Screenshots', () => {
  test('signup flow delivers email and shows inbox/message views', async ({ page, request }) => {
    test.setTimeout(120000);
    const signupEmail = `mailhog.demo.${Date.now()}@cyber2u.local`;

    await waitForApi(request, `${backendBaseUrl}/health`);
    await waitForApi(request, `${mailhogBaseUrl}/api/v2/messages`);

    const signupResponse = await request.post(`${backendBaseUrl}/api/auth/request-magic-link`, {
      data: { email: signupEmail },
    });
    expect(signupResponse.ok()).toBeTruthy();

    await pollForMail(request, signupEmail);

    await page.goto(`${mailhogBaseUrl}/`);
    await expect(page.getByRole('link', { name: /MailHog/ })).toBeVisible();

    for (let i = 0; i < 10; i += 1) {
      if (await page.getByText(signupEmail).first().isVisible().catch(() => false)) {
        break;
      }
      await page.reload();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText(signupEmail).first()).toBeVisible();
    await page.screenshot({
      path: screenshotPath('04-completed-quizzes-overlay.png'),
      fullPage: true,
    });

    await page.getByText(signupEmail).first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: screenshotPath('08-mailhog-verify-message.png'),
      fullPage: true,
    });
  });
});
