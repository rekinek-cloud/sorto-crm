import { test, expect } from '@playwright/test';

const TOKEN = process.env.TEST_TOKEN || '';

test('Debug: What does browser actually see', async ({ browser }) => {
  // Business domain
  const businessCtx = await browser.newContext();
  const businessPage = await businessCtx.newPage();

  await businessPage.context().addCookies([{
    name: 'access_token',
    value: TOKEN,
    domain: 'business.dev.sorto.ai',
    path: '/',
    secure: true,
    sameSite: 'Lax' as const,
  }]);

  // Log network requests
  const businessRequests: string[] = [];
  businessPage.on('request', req => {
    if (req.url().includes('overlay') || req.url().includes('navigation')) {
      businessRequests.push(`REQUEST: ${req.url()}`);
    }
  });

  businessPage.on('response', async res => {
    if (res.url().includes('overlay') || res.url().includes('navigation')) {
      const body = await res.text().catch(() => 'ERROR');
      businessRequests.push(`RESPONSE ${res.status()}: ${res.url()}`);
      businessRequests.push(`BODY: ${body.substring(0, 500)}`);
    }
  });

  console.log('\n========== BUSINESS.DEV.SORTO.AI ==========');
  await businessPage.goto('https://business.dev.sorto.ai/pl/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await businessPage.waitForTimeout(2000);

  console.log('Network requests:', businessRequests);

  // Check what's in the sidebar
  const businessNav = await businessPage.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return 'NO NAV FOUND';
    const items = nav.querySelectorAll('a[href*="/dashboard"]');
    return Array.from(items).map(a => a.textContent).slice(0, 10);
  });
  console.log('Business nav items:', businessNav);

  // Check branding text
  const businessBranding = await businessPage.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Focus Photo')) return 'Focus Photo';
    if (body.includes('Sorto Business')) return 'Sorto Business';
    if (body.includes('STREAMS')) return 'STREAMS';
    return 'UNKNOWN';
  });
  console.log('Business branding:', businessBranding);

  await businessPage.screenshot({ path: 'e2e/screenshots/debug-business.png', fullPage: true });

  // Foto domain
  console.log('\n========== FOTO.DEV.SORTO.AI ==========');
  const fotoCtx = await browser.newContext();
  const fotoPage = await fotoCtx.newPage();

  await fotoPage.context().addCookies([{
    name: 'access_token',
    value: TOKEN,
    domain: 'foto.dev.sorto.ai',
    path: '/',
    secure: true,
    sameSite: 'Lax' as const,
  }]);

  const fotoRequests: string[] = [];
  fotoPage.on('request', req => {
    if (req.url().includes('overlay') || req.url().includes('navigation')) {
      fotoRequests.push(`REQUEST: ${req.url()}`);
    }
  });

  fotoPage.on('response', async res => {
    if (res.url().includes('overlay') || res.url().includes('navigation')) {
      const body = await res.text().catch(() => 'ERROR');
      fotoRequests.push(`RESPONSE ${res.status()}: ${res.url()}`);
      fotoRequests.push(`BODY: ${body.substring(0, 500)}`);
    }
  });

  await fotoPage.goto('https://foto.dev.sorto.ai/pl/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await fotoPage.waitForTimeout(2000);

  console.log('Network requests:', fotoRequests);

  const fotoNav = await fotoPage.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return 'NO NAV FOUND';
    const items = nav.querySelectorAll('a[href*="/dashboard"]');
    return Array.from(items).map(a => a.textContent).slice(0, 10);
  });
  console.log('Foto nav items:', fotoNav);

  const fotoBranding = await fotoPage.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Focus Photo')) return 'Focus Photo';
    if (body.includes('Sorto Business')) return 'Sorto Business';
    if (body.includes('STREAMS')) return 'STREAMS';
    return 'UNKNOWN';
  });
  console.log('Foto branding:', fotoBranding);

  await fotoPage.screenshot({ path: 'e2e/screenshots/debug-foto.png', fullPage: true });

  await businessCtx.close();
  await fotoCtx.close();

  // Assert they are different
  console.log('\n========== COMPARISON ==========');
  console.log('Business branding:', businessBranding);
  console.log('Foto branding:', fotoBranding);

  expect(businessBranding).not.toBe(fotoBranding);
});
