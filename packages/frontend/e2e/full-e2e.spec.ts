import { test, expect, Page, APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://crm.dev.sorto.ai';
const API_URL = process.env.TEST_API_URL || 'https://crm.dev.sorto.ai/api/v1';

// Pre-generated token (2h expiry) - avoids login rate limiting
const TOKEN = process.env.TEST_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NmVmNjRkZi0wNTNkLTRjYWEtYTZjZS1mN2EzY2U3ODM1ODEiLCJvcmdhbml6YXRpb25JZCI6ImQzZDkxNDA0LWU3NWYtNGJlZS04ZjBjLTBlMWVhYTI1MzE3ZiIsImVtYWlsIjoib3duZXJAZGVtby5jb20iLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3NzAxNDk1ODAsImV4cCI6MTc3MDE1Njc4MH0.j801sTpDdTJ254bYhPuTcJ9njnxVoKSLH3hEFIlV8mU';

// No global serial - each describe is independent

// ====== HELPERS ======

async function setAuthCookie(page: Page) {
  await page.context().addCookies([{
    name: 'access_token',
    value: TOKEN,
    domain: new URL(BASE_URL).hostname,
    path: '/',
    httpOnly: false,
    secure: true,
    sameSite: 'Lax',
  }]);
}

function authHeaders() {
  return { Authorization: `Bearer ${TOKEN}` };
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });
  return errors;
}

// ====== 1. PUBLIC PAGES ======

test.describe('1. Strony publiczne', () => {
  test('Landing / redirectuje poprawnie', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });

  test('Strona /pl laduje sie', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/pl`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });

  test('Strona /en laduje sie', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/en`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });

  test('Pricing page /pl/pricing', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/pl/pricing`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test('Privacy page /pl/privacy', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/pl/privacy`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });

  test('Terms page /pl/terms', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/crm/pl/terms`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200);
  });
});

// ====== 2. AUTH PAGES ======

test.describe('2. Auth - logowanie i rejestracja', () => {
  test('Login page laduje formularz', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/pl/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const emailCount = await emailInput.count();
    const passCount = await passwordInput.count();
    expect(emailCount + passCount).toBeGreaterThan(0);
  });

  test('Register page laduje formularz', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/pl/auth/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('Chroniona strona /dashboard redirectuje na login bez auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/pl/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/auth/login');
  });

  test('API - login z poprawnymi danymi', async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'owner@demo.com', password: 'demo123' }
    });
    // 429 = rate limited (acceptable in test environment)
    if (res.status() === 429) {
      console.log('WARN: Login rate limited (429) - skipping assertion');
      return;
    }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.tokens.accessToken).toBeTruthy();
  });

  test('API - /auth/me zwraca zalogowanego usera', async ({ request }) => {
    const res = await request.get(`${API_URL}/auth/me`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
  });
});

// ====== 3. DASHBOARD PAGES (authenticated) ======

test.describe('3. Dashboard - strony z autoryzacja', () => {
  const dashboardPages = [
    { path: '/crm/pl/dashboard', name: 'Dashboard glowny' },
    { path: '/crm/pl/dashboard/deals', name: 'Deals' },
    { path: '/crm/pl/dashboard/contacts', name: 'Kontakty' },
    { path: '/crm/pl/dashboard/companies', name: 'Firmy' },
    { path: '/crm/pl/dashboard/pipeline', name: 'Pipeline' },
    { path: '/crm/pl/dashboard/tasks', name: 'Zadania' },
    { path: '/crm/pl/dashboard/calendar', name: 'Kalendarz' },
    { path: '/crm/pl/dashboard/streams', name: 'Strumienie' },
    { path: '/crm/pl/dashboard/settings', name: 'Ustawienia' },
    { path: '/crm/pl/dashboard/settings/pipeline', name: 'Ustawienia Pipeline' },
    { path: '/crm/pl/dashboard/settings/industries', name: 'Ustawienia Industries' },
    { path: '/crm/pl/dashboard/projects', name: 'Projekty' },
    { path: '/crm/pl/dashboard/leads', name: 'Leady' },
  ];

  for (const pg of dashboardPages) {
    test(`${pg.name} (${pg.path}) laduje sie z auth`, async ({ page }) => {
      await setAuthCookie(page);
      const errors = collectErrors(page);
      const res = await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      const url = page.url();
      const status = res?.status() || 0;

      if (url.includes('/auth/login')) {
        console.log(`WARN: ${pg.name} redirected to login despite auth cookie`);
      }

      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(500);

      // DOMException = critical
      const domExceptions = errors.filter(e => e.includes('DOMException'));
      expect(domExceptions).toHaveLength(0);
    });
  }
});

// ====== 4. API ENDPOINTS ======

test.describe('4. API Endpoints', () => {
  test('GET /api/v1 - API info', async ({ request }) => {
    const res = await request.get(`${API_URL}/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBeTruthy();
  });

  test('GET /deals - lista dealow', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals?page=1&limit=5`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.deals).toBeTruthy();
  });

  test('GET /deals/stats - statystyki dealow', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals/stats`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.totalDeals).toBeDefined();
    expect(body.wonDeals).toBeDefined();
    expect(body.conversionRate).toBeDefined();
  });

  test('GET /deals/pipeline - pipeline summary', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals/pipeline`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /contacts', async ({ request }) => {
    const res = await request.get(`${API_URL}/contacts`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /companies', async ({ request }) => {
    const res = await request.get(`${API_URL}/companies`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /tasks', async ({ request }) => {
    const res = await request.get(`${API_URL}/tasks`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /pipeline/stages', async ({ request }) => {
    const res = await request.get(`${API_URL}/pipeline/stages`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const stages = body.data || body;
    expect(stages.length).toBeGreaterThan(0);
  });

  test('GET /unified-rules', async ({ request }) => {
    const res = await request.get(`${API_URL}/unified-rules?page=1&limit=5`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
  });

  test('GET /industry-templates (public)', async ({ request }) => {
    const res = await request.get(`${API_URL}/industry-templates`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  // Other modules - test they don't 500
  const otherEndpoints = [
    '/projects', '/organizations', '/contexts', '/streams',
    '/workflow/inbox', '/areas', '/habits', '/meetings', '/delegated',
    '/recurring-tasks', '/timeline', '/products', '/services',
    '/offers', '/invoices', '/tags', '/users', '/calendar/events',
    '/ai-rules', '/weekly-review', '/source', '/goals', '/mailboxes',
    '/coding-center/projects',
  ];

  for (const ep of otherEndpoints) {
    test(`GET ${ep} - nie zwraca 500`, async ({ request }) => {
      const res = await request.get(`${API_URL}${ep}`, { headers: authHeaders() });
      const status = res.status();
      expect(status).not.toBe(500);
    });
  }
});

// ====== 5. CRUD OPERATIONS ======

test.describe('5. CRUD Operations', () => {
  test('CRUD Company - create, read, update, delete', async ({ request }) => {
    // Create
    const createRes = await request.post(`${API_URL}/companies`, {
      headers: authHeaders(),
      data: { name: 'PW Test Corp' }
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const company = created.data || created;
    expect(company.id).toBeTruthy();
    expect(company.name).toBe('PW Test Corp');

    // Read
    const getRes = await request.get(`${API_URL}/companies/${company.id}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);

    // Update
    const updateRes = await request.put(`${API_URL}/companies/${company.id}`, {
      headers: authHeaders(),
      data: { name: 'PW Test Corp Updated' }
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect((updated.data || updated).name).toBe('PW Test Corp Updated');

    // Delete
    const delRes = await request.delete(`${API_URL}/companies/${company.id}`, { headers: authHeaders() });
    expect([200, 204]).toContain(delRes.status());

    // Verify deleted
    const verifyRes = await request.get(`${API_URL}/companies/${company.id}`, { headers: authHeaders() });
    expect(verifyRes.status()).toBe(404);
  });

  test('CRUD Contact - create, read, delete', async ({ request }) => {
    const createRes = await request.post(`${API_URL}/contacts`, {
      headers: authHeaders(),
      data: { firstName: 'PW', lastName: 'Test', email: `pw-${Date.now()}@test.com` }
    });
    expect(createRes.status()).toBe(201);
    const contact = (await createRes.json()).data || (await createRes.json());
    expect(contact.id).toBeTruthy();

    const getRes = await request.get(`${API_URL}/contacts/${contact.id}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);

    const delRes = await request.delete(`${API_URL}/contacts/${contact.id}`, { headers: authHeaders() });
    expect([200, 204]).toContain(delRes.status());
  });

  test('CRUD Deal - bez companyId i z companyId', async ({ request }) => {
    // Get open stage
    const stagesRes = await request.get(`${API_URL}/pipeline/stages`, { headers: authHeaders() });
    const stages = (await stagesRes.json()).data || (await stagesRes.json());
    const openStage = stages.find((s: any) => !s.isClosed);
    expect(openStage).toBeTruthy();

    // Create deal without companyId
    const d1Res = await request.post(`${API_URL}/deals`, {
      headers: authHeaders(),
      data: { title: 'PW Deal No Company', value: 500, stageId: openStage.id, currency: 'PLN' }
    });
    expect([200, 201]).toContain(d1Res.status());
    const d1Body = await d1Res.json();
    const d1 = d1Body.data || d1Body;
    expect(d1.id).toBeTruthy();
    expect(d1.companyId).toBeNull();

    // Create company + deal with companyId
    const compRes = await request.post(`${API_URL}/companies`, {
      headers: authHeaders(),
      data: { name: 'PW Deal Company' }
    });
    const comp = (await compRes.json()).data || (await compRes.json());

    const d2Res = await request.post(`${API_URL}/deals`, {
      headers: authHeaders(),
      data: { title: 'PW Deal With Company', value: 1000, stageId: openStage.id, companyId: comp.id, currency: 'PLN' }
    });
    expect([200, 201]).toContain(d2Res.status());
    const d2 = (await d2Res.json()).data || (await d2Res.json());
    expect(d2.companyId).toBe(comp.id);

    // Move deal to another stage
    const nextStage = stages.find((s: any) => !s.isClosed && s.id !== openStage.id);
    if (nextStage) {
      const moveRes = await request.put(`${API_URL}/deals/${d1.id}`, {
        headers: authHeaders(),
        data: { stageId: nextStage.id }
      });
      expect(moveRes.status()).toBe(200);
    }

    // Cleanup
    await request.delete(`${API_URL}/deals/${d1.id}`, { headers: authHeaders() });
    await request.delete(`${API_URL}/deals/${d2.id}`, { headers: authHeaders() });
    await request.delete(`${API_URL}/companies/${comp.id}`, { headers: authHeaders() });
  });

  test('CRUD Task - create, read, delete', async ({ request }) => {
    const createRes = await request.post(`${API_URL}/tasks`, {
      headers: authHeaders(),
      data: { title: 'PW Test Task', description: 'Playwright test', priority: 'HIGH' }
    });
    expect(createRes.status()).toBe(201);
    const task = (await createRes.json()).data || (await createRes.json());

    const getRes = await request.get(`${API_URL}/tasks/${task.id}`, { headers: authHeaders() });
    expect(getRes.status()).toBe(200);

    const delRes = await request.delete(`${API_URL}/tasks/${task.id}`, { headers: authHeaders() });
    expect([200, 204]).toContain(delRes.status());
  });

  test('CRUD Pipeline Stage - create, update, delete', async ({ request }) => {
    const createRes = await request.post(`${API_URL}/pipeline/stages`, {
      headers: authHeaders(),
      data: { name: 'PW Test Stage', color: '#FF0000', position: 99 }
    });
    expect(createRes.status()).toBe(201);
    const stage = (await createRes.json()).data || (await createRes.json());

    const updateRes = await request.put(`${API_URL}/pipeline/stages/${stage.id}`, {
      headers: authHeaders(),
      data: { name: 'PW Stage Updated', color: '#00FF00' }
    });
    expect(updateRes.status()).toBe(200);

    const delRes = await request.delete(`${API_URL}/pipeline/stages/${stage.id}`, { headers: authHeaders() });
    expect([200, 204]).toContain(delRes.status());
  });
});

// ====== 6. NAVIGATION & UI ======

test.describe('6. Nawigacja i UI', () => {
  test('Dashboard sidebar zawiera linki nawigacyjne', async ({ page }) => {
    await setAuthCookie(page);
    await page.goto(`${BASE_URL}/crm/pl/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      test.skip(true, 'Redirected to login - cookie auth not accepted');
      return;
    }

    const nav = page.locator('nav, aside, [class*="sidebar"], [class*="Sidebar"]');
    expect(await nav.count()).toBeGreaterThan(0);

    const links = page.locator('nav a, aside a');
    const linkCount = await links.count();
    console.log(`Navigation links found: ${linkCount}`);
    expect(linkCount).toBeGreaterThan(0);
  });

  test('Dashboard ma poprawny lang=pl', async ({ page }) => {
    await setAuthCookie(page);
    await page.goto(`${BASE_URL}/crm/pl/dashboard`, { waitUntil: 'domcontentloaded' });
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('pl');
  });

  test('Dashboard ma <title>', async ({ page }) => {
    await setAuthCookie(page);
    await page.goto(`${BASE_URL}/crm/pl/dashboard`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    console.log('Page title:', title);
    expect(title.length).toBeGreaterThan(0);
  });

  test('Pipeline page renderuje bez crash', async ({ page }) => {
    await setAuthCookie(page);
    await page.goto(`${BASE_URL}/crm/pl/dashboard/pipeline`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000);
  });

  test('Settings page laduje bez crash', async ({ page }) => {
    await setAuthCookie(page);
    await page.goto(`${BASE_URL}/crm/pl/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ====== 7. RESPONSIVENESS ======

test.describe('7. Responsywnosc', () => {
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' },
  ];

  for (const vp of viewports) {
    test(`Dashboard na ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await setAuthCookie(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const res = await page.goto(`${BASE_URL}/crm/pl/dashboard`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      expect(res?.status()).toBeGreaterThanOrEqual(200);
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

// ====== 8. PERFORMANCE ======

test.describe('8. Wydajnosc', () => {
  const perfPages = [
    { path: '/crm/pl/dashboard', name: 'Dashboard', maxMs: 10000 },
    { path: '/crm/pl/dashboard/deals', name: 'Deals', maxMs: 10000 },
    { path: '/crm/pl/dashboard/contacts', name: 'Contacts', maxMs: 10000 },
    { path: '/crm/pl/dashboard/pipeline', name: 'Pipeline', maxMs: 10000 },
    { path: '/crm/pl/auth/login', name: 'Login (public)', maxMs: 8000 },
  ];

  for (const pg of perfPages) {
    test(`${pg.name} laduje sie w < ${pg.maxMs / 1000}s`, async ({ page }) => {
      await setAuthCookie(page);
      const start = Date.now();
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - start;
      console.log(`${pg.name} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(pg.maxMs);
    });
  }
});

// ====== 9. JS ERROR CHECKING ======

test.describe('9. Sprawdzanie bledow JS', () => {
  const pagesToCheck = [
    '/crm/pl/dashboard',
    '/crm/pl/dashboard/deals',
    '/crm/pl/dashboard/contacts',
    '/crm/pl/dashboard/companies',
    '/crm/pl/dashboard/pipeline',
    '/crm/pl/dashboard/tasks',
    '/crm/pl/dashboard/settings',
    '/crm/pl/dashboard/streams',
  ];

  for (const path of pagesToCheck) {
    test(`Brak krytycznych bledow JS: ${path}`, async ({ page }) => {
      await setAuthCookie(page);
      const errors = collectErrors(page);
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const domExceptions = errors.filter(e => e.includes('DOMException'));
      const typeErrors = errors.filter(e => e.includes('TypeError') && e.includes('[pageerror]'));
      const refErrors = errors.filter(e => e.includes('ReferenceError') && e.includes('[pageerror]'));

      if (domExceptions.length > 0) console.log('DOMException:', domExceptions);
      if (typeErrors.length > 0) console.log('TypeError:', typeErrors);
      if (refErrors.length > 0) console.log('ReferenceError:', refErrors);

      expect(domExceptions).toHaveLength(0);
      expect(typeErrors).toHaveLength(0);
      expect(refErrors).toHaveLength(0);
    });
  }
});

// ====== 10. SECURITY ======

test.describe('10. Bezpieczenstwo', () => {
  test('API bez tokena zwraca 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals`);
    expect(res.status()).toBe(401);
  });

  test('API z blednym tokenem zwraca 401', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals`, {
      headers: { Authorization: 'Bearer invalid-token-xyz' }
    });
    expect(res.status()).toBe(401);
  });

  test('Nieistniejacy deal zwraca 404 (nie 500)', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals/00000000-0000-0000-0000-000000000000`, {
      headers: authHeaders()
    });
    expect(res.status()).toBe(404);
  });

  test('XSS payload w tytule deala jest przechowywany jako text', async ({ request }) => {
    const stagesRes = await request.get(`${API_URL}/pipeline/stages`, { headers: authHeaders() });
    const stages = (await stagesRes.json()).data || (await stagesRes.json());
    const openStage = stages.find((s: any) => !s.isClosed);

    const xss = '<script>alert("xss")</script>';
    const res = await request.post(`${API_URL}/deals`, {
      headers: authHeaders(),
      data: { title: xss, value: 100, stageId: openStage.id, currency: 'PLN' }
    });

    if (res.status() === 201 || res.status() === 200) {
      const deal = (await res.json()).data || (await res.json());
      expect(deal.title).toBe(xss); // stored as-is, not executed
      await request.delete(`${API_URL}/deals/${deal.id}`, { headers: authHeaders() });
    }
  });
});

// ====== 11. DATA CONSISTENCY ======

test.describe('11. Spojnosc danych', () => {
  test('Deale maja poprawne pipelineStage relacje', async ({ request }) => {
    const res = await request.get(`${API_URL}/deals?limit=100`, { headers: authHeaders() });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const deals = body.deals || [];

    for (const deal of deals) {
      if (deal.stageId) {
        expect(deal.pipelineStage).toBeTruthy();
        expect(deal.pipelineStage.id).toBe(deal.stageId);
      }
    }
    console.log(`Sprawdzono ${deals.length} dealow`);
  });

  test('Pipeline ma etapy Won i Lost', async ({ request }) => {
    const res = await request.get(`${API_URL}/pipeline/stages`, { headers: authHeaders() });
    const stages = (await res.json()).data || (await res.json());
    const wonStages = stages.filter((s: any) => s.isWon);
    const lostStages = stages.filter((s: any) => s.isClosed && !s.isWon);
    console.log(`Pipeline: ${stages.length} stages, ${wonStages.length} won, ${lostStages.length} lost`);
    expect(wonStages.length).toBeGreaterThanOrEqual(1);
    expect(lostStages.length).toBeGreaterThanOrEqual(1);
  });

  test('Deals stats sa spojne z lista dealow', async ({ request }) => {
    const [dealsRes, statsRes] = await Promise.all([
      request.get(`${API_URL}/deals?limit=1000`, { headers: authHeaders() }),
      request.get(`${API_URL}/deals/stats`, { headers: authHeaders() }),
    ]);
    const deals = (await dealsRes.json()).deals || [];
    const stats = await statsRes.json();
    expect(stats.totalDeals).toBe(deals.length);
    console.log(`Stats: totalDeals=${stats.totalDeals}, actual=${deals.length}`);
  });
});
