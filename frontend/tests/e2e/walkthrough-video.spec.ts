import { test, expect } from '@playwright/test';

test.use({ video: 'on' });

test.describe('Cyber2U Walkthrough Video', () => {
  test('setup to user testing and visualisation flow', async ({ page }) => {
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

    // 3) Dashboard visualisation
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Your Cyber Literacy Journey' })).toBeVisible();
    await expect(page.getByText(/Quizzes Completed/i)).toBeVisible();
    await page.waitForTimeout(1500);

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
    await page.waitForTimeout(1200);

    // 6) MailHog inbox visualisation
    await page.goto('http://127.0.0.1:8025');
    await expect(page.getByRole('link', { name: /MailHog/ })).toBeVisible();
    await page.waitForTimeout(1800);
  });
});
