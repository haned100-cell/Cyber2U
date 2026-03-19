import { test, expect } from '@playwright/test';

test.describe('Cyber2U Frontend Smoke', () => {
  test('signup page renders', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Join Cyber2You' })).toBeVisible();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });
});
