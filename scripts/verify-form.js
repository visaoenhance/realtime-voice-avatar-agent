// Verification script using Playwright. Run:
//   npm i -D playwright
//   npx playwright install
//   BASE_URL=http://localhost:3001 node scripts/verify-form.js (or omit BASE_URL to use 3000)

const { chromium } = require('playwright');

(async () => {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[browser]', msg.type(), msg.text());
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    const input = page.locator('input[placeholder="Type your message and press Enter"]');
    await input.waitFor({ state: 'visible', timeout: 5000 });

    await input.fill('Say hello');
    await page.click('button[type="submit"]');

    await page.locator('text=assistant:').first().waitFor({ timeout: 20000 });

    console.log('OK: Form submitted and assistant responded.');
  } catch (err) {
    console.error('FAIL:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
