import { test, expect } from '@playwright/test';

const BASE_URL = 'https://business.dev.sorto.ai';

test.describe('Bug Report Button', () => {
  test('Przycisk zgłoszenia błędu jest widoczny na dashboardzie', async ({ page }) => {
    // Login via API
    const loginResponse = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'emc3@o2.pl',
        password: 'TestPassword123!'
      }
    });

    const loginData = await loginResponse.json();
    const accessToken = loginData.data?.tokens?.accessToken;

    if (!loginResponse.ok() || !accessToken) {
      console.log('Login failed');
      test.skip();
      return;
    }

    // Set cookies for auth
    await page.context().addCookies([
      {
        name: 'access_token',
        value: accessToken,
        domain: 'business.dev.sorto.ai',
        path: '/'
      }
    ]);

    // Go to dashboard
    await page.goto(`${BASE_URL}/pl/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take viewport screenshot (not fullPage)
    await page.screenshot({ path: 'e2e-results/dashboard-viewport.png' });

    // Check for bug report button
    const bugButton = page.locator('button[title="Zgłoś błąd"]');
    const count = await bugButton.count();
    console.log('Bug button count:', count);

    if (count > 0) {
      // Get button bounding box
      const box = await bugButton.boundingBox();
      console.log('Bug button position:', box);

      // Check if button is visible
      const isVisible = await bugButton.isVisible();
      console.log('Bug button isVisible:', isVisible);

      // Highlight the button by taking screenshot with it focused
      await bugButton.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'e2e-results/dashboard-with-button.png' });

      // Click the button to open modal
      await bugButton.click();
      await page.waitForTimeout(1000);

      // Take screenshot of modal
      await page.screenshot({ path: 'e2e-results/bug-report-modal.png' });

      // Check if modal appeared
      const modal = page.locator('text=Zgłoś błąd').first();
      const modalVisible = await modal.isVisible();
      console.log('Modal visible after click:', modalVisible);

      expect(isVisible).toBe(true);
    } else {
      console.log('Bug button NOT FOUND on page');

      // Log all fixed elements
      const fixedElements = await page.locator('.fixed').all();
      console.log('Fixed elements count:', fixedElements.length);

      // Check page HTML for bug-related content
      const html = await page.content();
      const hasBugText = html.includes('Zgłoś błąd');
      const hasOrangeClass = html.includes('bg-orange-500');
      console.log('Page has Zgłoś błąd:', hasBugText);
      console.log('Page has bg-orange-500:', hasOrangeClass);

      // Save HTML for debugging
      const fs = require('fs');
      fs.writeFileSync('e2e-results/dashboard.html', html);

      expect(count).toBeGreaterThan(0);
    }
  });
});
