import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screenshotDir = path.resolve(process.cwd(), '../docs/screenshots');

function screenshotPath(filename: string): string {
  fs.mkdirSync(screenshotDir, { recursive: true });
  return path.join(screenshotDir, filename);
}

test.describe('Cyber2U Usage Screenshots', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('capture app usage screens', async ({ page }) => {
    // 1) Signup landing screen
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Join Cyber2You' })).toBeVisible();
    await page.screenshot({
      path: screenshotPath('01-signup-page.png'),
      fullPage: true,
    });

    // 2) Dashboard screen
    await page.goto('/dashboard');
    await expect(page.locator('body')).toContainText(/Your Cyber Literacy Journey|No progress data available\./);
    await page.screenshot({
      path: screenshotPath('02-dashboard-page.png'),
      fullPage: true,
    });

    // 3) Quiz screen
    await page.goto('/quiz');
    await expect(page.getByText('Loading quiz...')).toBeVisible();
    await page.screenshot({
      path: screenshotPath('03-improvement-overlay.png'),
      fullPage: true,
    });
  });
});
