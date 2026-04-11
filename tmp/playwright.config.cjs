/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: '.',
  testMatch: /.*\.spec\.(js|cjs)/,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true
  }
};
