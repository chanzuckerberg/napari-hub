import { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../', '.env'),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 3000,
  },
  globalSetup: './globalSetup',
  outputDir: '../report',
  /* Run tests in files in parallel */
  fullyParallel: true,
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: '../report/test-results.json',
      },
    ],
    [
      'html',
      {
        open: 'always',
        host: 'localhost',
        port: 9223,
      },
    ],
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.napari-hub.org/',
        video: 'on',
      },
    },
  ],
  testDir: '../tests',
  timeout: 30 * 1000,
  use: {
    actionTimeout: 0,
    baseURL: 'https://www.napari-hub.org/',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on',
  },
};
export default config;
