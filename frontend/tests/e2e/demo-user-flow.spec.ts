import { test, expect } from '@playwright/test';

test.describe('Demo User Bootstrap Visibility', () => {
  test('demo user route seeds data and dashboard/quiz become visible', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/demo-user');
    await expect(page.getByText(/Demo user ready/i)).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Your Cyber Literacy Journey' })).toBeVisible();
    await expect(page.getByText(/Quizzes Completed/i)).toBeVisible();

    await page.goto('/quiz');
    await expect(page.getByText(/Question 1 of/i)).toBeVisible();
  });
});
