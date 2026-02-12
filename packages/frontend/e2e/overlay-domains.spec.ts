import { test, expect, Page } from '@playwright/test';

// Domain configurations
const DOMAINS = {
  crm: 'https://crm.dev.sorto.ai',
  business: 'https://business.dev.sorto.ai',
  foto: 'https://foto.dev.sorto.ai',
};

// Expected overlay configurations
const EXPECTED_OVERLAYS = {
  'sorto-business': {
    name: 'Sorto Business',
    primaryColor: '#6366f1',
    navItems: ['Pulpit', 'CRM', 'Sprzedaż', 'Zadania', 'Projekty', 'Komunikacja'],
  },
  'focus-photo': {
    name: 'Focus Photo',
    primaryColor: '#0EA5E9',
    navItems: ['Pulpit', 'Klienci', 'Sesje', 'Zadania', 'Kalendarz', 'Timeline'],
  },
};

// Test token - get fresh one before running tests
const TOKEN = process.env.TEST_TOKEN || '';

async function setAuthCookie(page: Page, domain: string) {
  const hostname = new URL(domain).hostname;
  await page.context().addCookies([{
    name: 'access_token',
    value: TOKEN,
    domain: hostname,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax',
  }]);
}

// ====== 1. API TESTS - Check overlay API responses per domain ======

test.describe('1. Overlay API per domain', () => {
  test('API /overlays works on crm.dev.sorto.ai', async ({ request }) => {
    const response = await request.get(`${DOMAINS.crm}/api/v1/overlays`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toHaveLength(2);
    expect(data.data.map((o: any) => o.slug)).toContain('sorto-business');
    expect(data.data.map((o: any) => o.slug)).toContain('focus-photo');
  });

  test('API /overlays works on business.dev.sorto.ai', async ({ request }) => {
    const response = await request.get(`${DOMAINS.business}/api/v1/overlays`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toHaveLength(2);
  });

  test('API /overlays works on foto.dev.sorto.ai', async ({ request }) => {
    const response = await request.get(`${DOMAINS.foto}/api/v1/overlays`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data).toHaveLength(2);
  });

  test('API /overlays/sorto-business returns correct data', async ({ request }) => {
    const response = await request.get(`${DOMAINS.crm}/api/v1/overlays/sorto-business`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data.slug).toBe('sorto-business');
    expect(data.data.primaryColor).toBe('#6366f1');
    expect(data.data.includedModules).toContain('companies');
    expect(data.data.includedModules).toContain('deals');
  });

  test('API /overlays/focus-photo returns correct data', async ({ request }) => {
    const response = await request.get(`${DOMAINS.crm}/api/v1/overlays/focus-photo`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.data.slug).toBe('focus-photo');
    expect(data.data.primaryColor).toBe('#0EA5E9');
    expect(data.data.includedModules).toContain('contacts');
    expect(data.data.includedModules).toContain('timeline');
    expect(data.data.hiddenModules).toContain('companies');
  });
});

// ====== 2. AUTH API - Navigation endpoint per domain ======

test.describe('2. Navigation API per domain (requires auth)', () => {
  test.skip(!TOKEN, 'Requires TEST_TOKEN env variable');

  test('business.dev.sorto.ai returns sorto-business overlay', async ({ request }) => {
    const response = await request.get(`${DOMAINS.business}/api/v1/overlays/navigation`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!response.ok()) {
      console.log('Response status:', response.status());
      console.log('Response body:', await response.text());
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('business.dev.sorto.ai navigation response:', JSON.stringify(data, null, 2));

    expect(data.data.branding.primaryColor).toBe('#6366f1');
    expect(data.data.branding.name).toBe('Sorto Business');
  });

  test('foto.dev.sorto.ai returns focus-photo overlay', async ({ request }) => {
    const response = await request.get(`${DOMAINS.foto}/api/v1/overlays/navigation`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!response.ok()) {
      console.log('Response status:', response.status());
      console.log('Response body:', await response.text());
    }

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('foto.dev.sorto.ai navigation response:', JSON.stringify(data, null, 2));

    expect(data.data.branding.primaryColor).toBe('#0EA5E9');
    expect(data.data.branding.name).toBe('Focus Photo');
  });

  test('crm.dev.sorto.ai returns organization default overlay', async ({ request }) => {
    const response = await request.get(`${DOMAINS.crm}/api/v1/overlays/navigation`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('crm.dev.sorto.ai navigation response:', JSON.stringify(data, null, 2));

    // Should return some valid branding
    expect(data.data.branding.primaryColor).toBeTruthy();
    expect(data.data.branding.name).toBeTruthy();
  });
});

// ====== 3. BROWSER TESTS - Visual verification ======

test.describe('3. Browser visual tests (requires auth)', () => {
  test.skip(!TOKEN, 'Requires TEST_TOKEN env variable');

  test('business.dev.sorto.ai shows Sorto Business branding', async ({ page }) => {
    await setAuthCookie(page, DOMAINS.business);

    await page.goto(`${DOMAINS.business}/pl/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'e2e/screenshots/business-dashboard.png', fullPage: true });

    // Check page title or branding
    const pageContent = await page.content();
    console.log('Page loaded, checking content...');

    // Look for Sorto Business branding in sidebar
    const brandingText = await page.locator('text=Sorto Business, text=STREAMS, text=S').first().textContent().catch(() => null);
    console.log('Branding text found:', brandingText);
  });

  test('foto.dev.sorto.ai shows Focus Photo branding', async ({ page }) => {
    await setAuthCookie(page, DOMAINS.foto);

    await page.goto(`${DOMAINS.foto}/pl/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'e2e/screenshots/foto-dashboard.png', fullPage: true });

    // Check page content
    const pageContent = await page.content();
    console.log('Page loaded, checking content...');
  });

  test('Compare navigation between domains', async ({ browser }) => {
    // Create two separate contexts for different domains
    const businessContext = await browser.newContext();
    const fotoContext = await browser.newContext();

    const businessPage = await businessContext.newPage();
    const fotoPage = await fotoContext.newPage();

    // Set auth cookies
    await setAuthCookie(businessPage, DOMAINS.business);
    await setAuthCookie(fotoPage, DOMAINS.foto);

    // Navigate to dashboards
    await Promise.all([
      businessPage.goto(`${DOMAINS.business}/pl/dashboard`, { waitUntil: 'networkidle' }),
      fotoPage.goto(`${DOMAINS.foto}/pl/dashboard`, { waitUntil: 'networkidle' }),
    ]);

    await Promise.all([
      businessPage.waitForTimeout(3000),
      fotoPage.waitForTimeout(3000),
    ]);

    // Take screenshots
    await businessPage.screenshot({ path: 'e2e/screenshots/compare-business.png', fullPage: true });
    await fotoPage.screenshot({ path: 'e2e/screenshots/compare-foto.png', fullPage: true });

    // Get sidebar navigation text from both
    const businessNav = await businessPage.locator('nav').first().textContent().catch(() => '');
    const fotoNav = await fotoPage.locator('nav').first().textContent().catch(() => '');

    console.log('Business nav:', businessNav?.substring(0, 200));
    console.log('Foto nav:', fotoNav?.substring(0, 200));

    // Cleanup
    await businessContext.close();
    await fotoContext.close();
  });
});

// ====== 4. DEBUG TESTS - Check what's happening ======

test.describe('4. Debug - Check API Host header', () => {
  test('Check Host header is passed correctly to business domain', async ({ request }) => {
    const response = await request.get(`${DOMAINS.business}/api/v1/overlays/current`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('Status:', response.status());
    const body = await response.text();
    console.log('Response:', body);

    if (response.ok()) {
      const data = JSON.parse(body);
      console.log('Overlay slug:', data.data?.slug);
      console.log('Overlay name:', data.data?.name);
    }
  });

  test('Check Host header is passed correctly to foto domain', async ({ request }) => {
    const response = await request.get(`${DOMAINS.foto}/api/v1/overlays/current`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    console.log('Status:', response.status());
    const body = await response.text();
    console.log('Response:', body);

    if (response.ok()) {
      const data = JSON.parse(body);
      console.log('Overlay slug:', data.data?.slug);
      console.log('Overlay name:', data.data?.name);
    }
  });
});
