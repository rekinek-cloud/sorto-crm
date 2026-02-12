import { test, expect } from '@playwright/test';

test('Landing page shows different branding per domain', async ({ browser }) => {
  // Business domain
  const businessCtx = await browser.newContext();
  const businessPage = await businessCtx.newPage();

  console.log('\n========== BUSINESS.DEV.SORTO.AI /pl ==========');
  await businessPage.goto('https://business.dev.sorto.ai/pl', { waitUntil: 'networkidle', timeout: 30000 });
  await businessPage.waitForTimeout(2000);

  const businessBranding = await businessPage.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Focus Photo')) return 'Focus Photo';
    if (body.includes('Sorto Business')) return 'Sorto Business';
    if (body.includes('STREAMS')) return 'STREAMS';
    return 'UNKNOWN';
  });
  console.log('Business landing branding:', businessBranding);

  await businessPage.screenshot({ path: 'e2e/screenshots/landing-business.png', fullPage: false });

  // Foto domain
  console.log('\n========== FOTO.DEV.SORTO.AI /pl ==========');
  const fotoCtx = await browser.newContext();
  const fotoPage = await fotoCtx.newPage();

  await fotoPage.goto('https://foto.dev.sorto.ai/pl', { waitUntil: 'networkidle', timeout: 30000 });
  await fotoPage.waitForTimeout(2000);

  const fotoBranding = await fotoPage.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Focus Photo')) return 'Focus Photo';
    if (body.includes('Sorto Business')) return 'Sorto Business';
    if (body.includes('STREAMS')) return 'STREAMS';
    return 'UNKNOWN';
  });
  console.log('Foto landing branding:', fotoBranding);

  await fotoPage.screenshot({ path: 'e2e/screenshots/landing-foto.png', fullPage: false });

  await businessCtx.close();
  await fotoCtx.close();

  console.log('\n========== COMPARISON ==========');
  console.log('Business:', businessBranding);
  console.log('Foto:', fotoBranding);

  expect(businessBranding).toBe('Sorto Business');
  expect(fotoBranding).toBe('Focus Photo');
});
