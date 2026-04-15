import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  // Do not fail-fast: continue to next test even on failure
  forbidOnly: false,

  outputDir: 'docs/user-guide/playwright-output',

  use: {
    baseURL: 'https://localhost:5665',
    ignoreHTTPSErrors: true,
    screenshot: 'off',
    video: 'off',
    trace: 'off',
    viewport: { width: 1194, height: 834 },
  },

  projects: [
    // Primary project: Chromium with iPad viewport + UA.
    // WebKit (ipad-11) is not used for screenshot journeys because
    // Playwright's headless WebKit does not support OPFS SAH pool VFS,
    // causing the SQLite WASM bootstrap to fail with an UnknownError.
    {
      name: 'ipad-11',
      use: {
        browserName: 'chromium',
        viewport: { width: 1194, height: 834 },
        ignoreHTTPSErrors: true,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        launchOptions: {
          args: ['--use-gl=angle', '--use-angle=swiftshader'],
        },
      },
    },
  ],

  // Do NOT start a webServer — already running at https://localhost:5665
})
