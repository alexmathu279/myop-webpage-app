import { test, expect } from '@playwright/test';
test('login validation works', async ({ page }) => {
  await page.goto('/login');

  await page.click('button[type="submit"]');

  await expect(page.locator('input:invalid').first()).toBeVisible();
});