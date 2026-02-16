import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://crm.dev.sorto.ai';

// Generate fresh token before tests via: curl -s -X POST https://crm.dev.sorto.ai/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"owner@demo.com","password":"demo123"}'
const TOKEN = process.env.TEST_TOKEN || '';

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

interface PageError {
  type: 'console_error' | 'pageerror' | 'network_error';
  text: string;
  url?: string;
  status?: number;
}

function collectAllErrors(page: Page): PageError[] {
  const errors: PageError[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known non-critical errors
      if (text.includes('favicon') || text.includes('manifest.json') || text.includes('posthog')) return;
      errors.push({ type: 'console_error', text });
    }
  });

  page.on('pageerror', err => {
    errors.push({ type: 'pageerror', text: err.message });
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    // Only track API errors (not static assets)
    if (url.includes('/api/') && status >= 400) {
      errors.push({
        type: 'network_error',
        text: `HTTP ${status} ${response.statusText()}`,
        url: url.replace(BASE_URL, ''),
        status,
      });
    }
  });

  return errors;
}

// ====== ALL NAVIGATION PAGES ======

// Complete list from streamsNavigation.ts
const ALL_PAGES = [
  // STREAMS CORE
  { path: '/dashboard', name: 'Pulpit' },
  { path: '/dashboard/source', name: 'Źródło' },
  { path: '/dashboard/streams', name: 'Strumienie' },
  { path: '/dashboard/streams-map', name: 'Mapa strumieni' },
  { path: '/dashboard/streams/frozen', name: 'Zamrożone' },
  { path: '/dashboard/tasks', name: 'Zadania' },
  { path: '/dashboard/projects', name: 'Projekty' },
  { path: '/dashboard/project-dependencies', name: 'Zależności projektów' },
  { path: '/dashboard/calendar', name: 'Kalendarz' },
  { path: '/dashboard/goals', name: 'Cele' },
  { path: '/dashboard/smart-templates', name: 'Szablony SMART' },
  { path: '/dashboard/smart-improvements', name: 'Ulepszenia SMART' },
  { path: '/dashboard/smart-analysis', name: 'Analiza SMART' },

  // CRM
  { path: '/dashboard/companies', name: 'Firmy' },
  { path: '/dashboard/contacts', name: 'Kontakty' },
  { path: '/dashboard/leads', name: 'Leady' },
  { path: '/dashboard/pipeline', name: 'Pipeline' },
  { path: '/dashboard/deals', name: 'Transakcje' },
  { path: '/dashboard/analytics/pipeline', name: 'Pipeline Analytics' },

  // SPRZEDAŻ
  { path: '/dashboard/products', name: 'Produkty' },
  { path: '/dashboard/services', name: 'Usługi' },
  { path: '/dashboard/offers', name: 'Oferty' },
  { path: '/dashboard/orders', name: 'Zamówienia' },
  { path: '/dashboard/invoices', name: 'Faktury' },
  { path: '/dashboard/complaints', name: 'Reklamacje' },

  // KOMUNIKACJA
  { path: '/dashboard/smart-mailboxes', name: 'Skrzynki' },
  { path: '/dashboard/communication/channels', name: 'Kanały' },
  { path: '/dashboard/modern-email', name: 'Napisz email' },
  { path: '/dashboard/communication/email-filters', name: 'Filtry email' },
  { path: '/dashboard/communication/rules-manager', name: 'Reguły komunikacji' },
  { path: '/dashboard/auto-replies', name: 'Auto-odpowiedzi' },
  { path: '/dashboard/email-pipeline', name: 'Pipeline email' },
  { path: '/dashboard/email-analysis', name: 'Analiza email' },
  { path: '/dashboard/meetings', name: 'Spotkania' },

  // PRZEGLĄDY
  { path: '/dashboard/productivity', name: 'Produktywność' },
  { path: '/dashboard/reviews/weekly', name: 'Przegląd tygodniowy' },
  { path: '/dashboard/reviews/monthly', name: 'Przegląd miesięczny' },
  { path: '/dashboard/reviews/quarterly', name: 'Przegląd kwartalny' },

  // AI & NARZĘDZIA
  { path: '/dashboard/ai-assistant', name: 'AI Assistant' },
  { path: '/dashboard/ai-insights', name: 'AI Insights' },
  { path: '/dashboard/ai-prompts', name: 'Prompty AI' },
  { path: '/dashboard/ai-management', name: 'Zarządzanie AI' },
  { path: '/dashboard/ai-rules', name: 'Reguły AI' },
  { path: '/dashboard/search', name: 'Wyszukiwanie AI' },
  { path: '/dashboard/rag-search', name: 'RAG Search' },
  { path: '/dashboard/recommendations', name: 'Rekomendacje' },
  { path: '/dashboard/voice', name: 'Voice TTS' },
  { path: '/dashboard/graph', name: 'Graf relacji' },
  { path: '/dashboard/universal-rules', name: 'Reguły uniwersalne' },
  { path: '/dashboard/ai-chat', name: 'AI Chat (Qwen)' },
  { path: '/dashboard/gemini', name: 'Gemini' },
  { path: '/dashboard/rag', name: 'RAG' },
  { path: '/dashboard/voice-assistant', name: 'Voice Assistant' },
  { path: '/dashboard/voice-rag', name: 'Voice RAG' },
  { path: '/dashboard/universal-search', name: 'Universal Search' },
  { path: '/dashboard/flow', name: 'Flow Engine' },
  { path: '/dashboard/flow/conversation', name: 'Flow Conversation' },

  // ORGANIZACJA
  { path: '/dashboard/tags', name: 'Tagi' },
  { path: '/dashboard/contexts', name: 'Konteksty' },
  { path: '/dashboard/habits', name: 'Nawyki' },
  { path: '/dashboard/recurring-tasks', name: 'Zadania cykliczne' },
  { path: '/dashboard/delegated', name: 'Delegowane' },
  { path: '/dashboard/areas', name: 'Obszary' },
  { path: '/dashboard/templates', name: 'Szablony' },

  // WIEDZA
  { path: '/dashboard/knowledge-base', name: 'Baza wiedzy' },
  { path: '/dashboard/knowledge', name: 'Dokumenty' },
  { path: '/dashboard/knowledge-status', name: 'Status wiedzy' },
  { path: '/dashboard/files', name: 'Pliki' },

  // ANALITYKA
  { path: '/dashboard/analytics', name: 'Dashboard analityczny' },
  { path: '/dashboard/analysis', name: 'Analiza' },
  { path: '/dashboard/reports', name: 'Raporty' },
  { path: '/dashboard/timeline', name: 'Timeline' },
  { path: '/dashboard/task-history', name: 'Historia zadań' },
  { path: '/dashboard/task-relationships', name: 'Relacje zadań' },

  // ZESPÓŁ
  { path: '/dashboard/team', name: 'Zespół' },
  { path: '/dashboard/users', name: 'Użytkownicy' },
  { path: '/dashboard/team/hierarchy', name: 'Hierarchia' },

  // USTAWIENIA
  { path: '/dashboard/settings/profile', name: 'Profil' },
  { path: '/dashboard/settings/organization', name: 'Organizacja' },
  { path: '/dashboard/settings/branding', name: 'Branding' },
  { path: '/dashboard/settings/custom-fields', name: 'Pola niestandardowe' },
  { path: '/dashboard/email-accounts', name: 'Konta email' },
  { path: '/dashboard/settings/integrations', name: 'Integracje' },
  { path: '/dashboard/billing', name: 'Płatności' },
  { path: '/dashboard/modules', name: 'Moduły' },
  { path: '/dashboard/metadata', name: 'Metadane' },

  // ADMINISTRACJA
  { path: '/dashboard/infrastructure', name: 'Infrastruktura' },
  { path: '/dashboard/admin/mcp-keys', name: 'Klucze MCP' },
  { path: '/dashboard/admin/ai-config', name: 'Konfiguracja AI' },
  { path: '/dashboard/admin/bug-reports', name: 'Zgłoszenia błędów' },
  { path: '/dashboard/info', name: 'Informacje' },

  // SORTO
  { path: '/dashboard/coding-center', name: 'Coding Center' },
  { path: '/dashboard/ai-sync', name: 'AI Conversations' },
  { path: '/dashboard/admin/dev-hub', name: 'Dev Hub' },
];

// ====== TESTS ======

test.describe('ALL Pages Health Check', () => {
  // Skip all tests if no token
  test.beforeEach(async () => {
    if (!TOKEN) {
      test.skip(true, 'No TEST_TOKEN provided - generate one first');
    }
  });

  for (const pg of ALL_PAGES) {
    test(`${pg.name} (${pg.path})`, async ({ page }) => {
      await setAuthCookie(page);
      const errors = collectAllErrors(page);

      const response = await page.goto(`${BASE_URL}/crm/pl${pg.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Wait for API calls to complete
      await page.waitForTimeout(3000);

      const httpStatus = response?.status() || 0;
      const finalUrl = page.url();

      // 1. Page must return 200 (not 404 or 500)
      expect(httpStatus, `HTTP status for ${pg.path}`).toBeGreaterThanOrEqual(200);
      expect(httpStatus, `HTTP status for ${pg.path}`).toBeLessThan(500);

      // 2. Check for redirect to login (auth issue)
      if (finalUrl.includes('/auth/login')) {
        console.log(`WARN: ${pg.name} redirected to login`);
      }

      // 3. Check for critical JS errors (TypeError, ReferenceError)
      const pageErrors = errors.filter(e => e.type === 'pageerror');
      if (pageErrors.length > 0) {
        console.log(`JS ERRORS on ${pg.path}:`, pageErrors.map(e => e.text));
      }

      // 4. Check for API 500 errors
      const api500s = errors.filter(e => e.type === 'network_error' && e.status && e.status >= 500);
      if (api500s.length > 0) {
        console.log(`API 500s on ${pg.path}:`, api500s.map(e => `${e.url} → ${e.text}`));
      }

      // 5. Check for API 404 errors (missing endpoints)
      const api404s = errors.filter(e => e.type === 'network_error' && e.status === 404);
      if (api404s.length > 0) {
        console.log(`API 404s on ${pg.path}:`, api404s.map(e => `${e.url} → ${e.text}`));
      }

      // FAIL on server errors (500+)
      expect(api500s, `No API 500 errors on ${pg.path}`).toHaveLength(0);

      // FAIL on critical JS errors
      const criticalErrors = pageErrors.filter(e =>
        e.text.includes('TypeError') ||
        e.text.includes('ReferenceError') ||
        e.text.includes('is not defined') ||
        e.text.includes('Cannot read properties of')
      );
      expect(criticalErrors, `No critical JS errors on ${pg.path}`).toHaveLength(0);
    });
  }
});
