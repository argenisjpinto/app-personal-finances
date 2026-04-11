const { test, expect } = require('playwright/test');

test('landing page loads', async ({ page }) => {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/localhost:5173/);
  await expect(page.locator('body')).toContainText(/Adia|Finance/i);
});
