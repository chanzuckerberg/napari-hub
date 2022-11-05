import { devices, PlaywrightTestConfig, Project } from '@playwright/test';

const { BROWSER } = process.env;
const { DEVICE } = process.env;
const CI = !!process.env.CI;

const PROJECTS: Project[] = [
  {
    name: 'chrome-mobile',
    use: devices['Pixel 5'],
  },
  {
    name: 'safari-mobile',
    use: devices['iPhone 13 Pro'],
  },
  {
    name: 'chrome-tablet',
    use: devices['Nexus 10'],
  },
  {
    name: 'safari-tablet',
    use: devices['iPad Mini'],
  },
  {
    name: 'chrome-laptop',
    use: devices['Desktop Chrome'],
  },
  {
    name: 'firefox-laptop',
    use: devices['Desktop Firefox'],
  },
  {
    name: 'safari-laptop',
    use: devices['Desktop Safari'],
  },
  {
    name: 'chrome-desktop',
    use: {
      browserName: 'chromium',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'firefox-desktop',
    use: {
      browserName: 'firefox',
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'safari-desktop',
    use: {
      browserName: 'webkit',
      viewport: { width: 1920, height: 1080 },
    },
  },
].filter((project) => {
  if (BROWSER && !project.name.includes(BROWSER)) {
    return false;
  }

  if (DEVICE && !project.name.includes(DEVICE)) {
    return false;
  }

  return true;
});

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: CI,
  /* Retry on CI only */
  retries: CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  // workers: CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: CI ? 'github' : process.env.REPORTER,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: PROJECTS,

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

// eslint-disable-next-line import/no-default-export
export default config;
