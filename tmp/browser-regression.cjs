const fs = require('fs');

async function loadPlaywright() {
  try {
    return require('playwright');
  } catch (error) {
    fs.writeFileSync(
      'tmp/browser-regression-error.log',
      `PLAYWRIGHT_REQUIRE_FAILED\n${error.stack || error.message}\n`,
      'utf8'
    );
    throw error;
  }
}

async function main() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const result = {
    url: page.url(),
    title: await page.title(),
    h1: await page.locator('h1').first().textContent().catch(() => null)
  };

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
