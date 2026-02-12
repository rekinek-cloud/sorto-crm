import { test, expect } from '@playwright/test';

test('Login redirects to correct dashboard URL', async ({ page }) => {
  // Go to foto login page
  await page.goto('https://foto.dev.sorto.ai/pl/auth/login');

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Fill in login form (use test credentials)
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Test123!');

  // Track navigation
  const navigationPromise = page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => null);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation or timeout
  await navigationPromise;
  await page.waitForTimeout(3000);

  // Get current URL
  const currentUrl = page.url();
  console.log('Final URL after login:', currentUrl);

  // Take screenshot
  await page.screenshot({ path: 'e2e/screenshots/login-redirect.png' });

  // Check URL doesn't contain /crm/
  expect(currentUrl).not.toContain('/crm/');

  // Check URL format is correct
  if (currentUrl.includes('/dashboard')) {
    expect(currentUrl).toMatch(/https:\/\/foto\.dev\.sorto\.ai\/pl\/dashboard/);
  }
});
