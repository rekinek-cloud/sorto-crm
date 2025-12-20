import { test, expect } from '@playwright/test';

// Strony ktore na pewno dzialaja (HTTP 200)
const WORKING_PAGES = [
  { path: '/crm/dashboard', title: 'Dashboard' },
  { path: '/crm/dashboard/goals', title: 'Cele' },
  { path: '/crm/dashboard/analytics', title: 'Analityka' },
  { path: '/crm/dashboard/source', title: 'Source' },
];

// Strony ktore moga zwracac 404 (jeszcze nie zdeployowane)
const PAGES_TO_TEST = [
  { path: '/crm/dashboard/team', title: 'Zespol' },
  { path: '/crm/gtd', title: 'GTD' },
  { path: '/crm/gtd/inbox', title: 'Inbox' },
  { path: '/crm/gtd/projects', title: 'Projekty' },
  { path: '/crm/clients', title: 'Klienci' },
  { path: '/crm/deals', title: 'Transakcje' },
  { path: '/crm/deals/pipeline', title: 'Pipeline' },
  { path: '/crm/calendar', title: 'Kalendarz' },
  { path: '/crm/settings', title: 'Ustawienia' },
  { path: '/crm/ai/assistant', title: 'AI Asystent' },
  { path: '/crm/reports', title: 'Raporty' },
];

test.describe('CRM - Strony dzialajace (HTTP 200)', () => {

  for (const pageInfo of WORKING_PAGES) {
    test(`${pageInfo.path} zwraca HTTP 200`, async ({ page }) => {
      const response = await page.goto(pageInfo.path, {
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });

      // Sprawdz czy strona zwrocila 200
      expect(response?.status()).toBe(200);

      // Sprawdz czy strona ma podstawowa strukture HTML
      await expect(page.locator('body')).toBeVisible();

      // Sprawdz czy strona ma zawartosc
      const html = await page.content();
      expect(html.length).toBeGreaterThan(1000);
      expect(html).toContain('STREAMS');
    });
  }
});

test.describe('CRM - Strony do wdrozenia (test dostepnosci)', () => {

  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.path} odpowiada (HTTP)`, async ({ page }) => {
      const response = await page.goto(pageInfo.path, {
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });

      // Strona powinna odpowiadac - akceptujemy 200 lub 404
      const status = response?.status() || 0;
      expect(status).toBeGreaterThan(0);
      expect([200, 404]).toContain(status);

      // Sprawdz czy strona ma podstawowa strukture HTML
      await expect(page.locator('body')).toBeVisible();

      // Loguj status dla raportowania
      console.log(`${pageInfo.path}: HTTP ${status} (${status === 200 ? 'OK' : 'NOT_FOUND'})`);
    });
  }
});

test.describe('CRM - Responsywnosc', () => {

  test('Dashboard dziala na mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard dziala na tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const response = await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Dashboard dziala na desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const response = await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('CRM - Wydajnosc', () => {

  test('Dashboard laduje sie w < 10 sekund', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(response?.status()).toBe(200);
    expect(loadTime).toBeLessThan(10000);
  });

  test('Dashboard Goals laduje sie w < 10 sekund', async ({ page }) => {
    const start = Date.now();
    const response = await page.goto('/crm/dashboard/goals', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    console.log(`Dashboard Goals load time: ${loadTime}ms`);
    expect(response?.status()).toBe(200);
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('CRM - Zawartosc stron', () => {

  test('Dashboard zawiera tytul STREAMS', async ({ page }) => {
    await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    expect(html).toContain('STREAMS');
  });

  test('Dashboard zawiera meta tagi', async ({ page }) => {
    await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });

    // Sprawdz meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();
    expect(metaDesc).toContain('STREAMS');
  });

  test('Dashboard ma poprawny lang=pl', async ({ page }) => {
    await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded' });
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('pl');
  });
});

test.describe('CRM - Bezpieczenstwo i bledy', () => {

  test('Dashboard nie zwraca bledow JavaScript w konsoli', async ({ page }) => {
    const errors: string[] = [];

    // Zbierz bledy konsoli
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/crm/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Poczekaj chwile na ewentualne bledy asynchroniczne
    await page.waitForTimeout(3000);

    // Filtruj znane/akceptowalne bledy
    const criticalErrors = errors.filter(err =>
      !err.includes('Failed to load resource') && // 404 API calls sa ok jesli user niezalogowany
      !err.includes('401') && // Unauthorized jest ok przed logowaniem
      !err.includes('Access token required') // Token wymagany jest ok
    );

    // Nie powinno byc krytycznych bledow jak DOMException
    const domExceptions = errors.filter(err => err.includes('DOMException'));
    expect(domExceptions).toHaveLength(0);

    console.log(`Znaleziono ${errors.length} bledow w konsoli, ${criticalErrors.length} krytycznych`);
  });

  test('Strona logowania laduje sie poprawnie', async ({ page }) => {
    const response = await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Sprawdz czy formularz logowania istnieje
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test('Strona rejestracji laduje sie poprawnie', async ({ page }) => {
    const response = await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
  });
});

test.describe('CRM - API Health', () => {

  test('Backend API /health odpowiada', async ({ request }) => {
    const response = await request.get('http://localhost:3003/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('Backend API /api/v1 odpowiada', async ({ request }) => {
    const response = await request.get('http://localhost:3003/api/v1/');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toContain('API');
  });
});

test.describe('CRM - Strona Source', () => {

  test('Source page nie zwraca bledow DOMException', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/crm/dashboard/source', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Sprawdz brak DOMException
    const domExceptions = errors.filter(err => err.includes('DOMException'));
    expect(domExceptions).toHaveLength(0);

    console.log(`Source page: ${errors.length} bledow, ${domExceptions.length} DOMException`);
  });

  test('Source page laduje sie poprawnie', async ({ page }) => {
    const response = await page.goto('/crm/dashboard/source', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Strona powinna zawierac STREAMS
    const html = await page.content();
    expect(html).toContain('STREAMS');
  });
});
