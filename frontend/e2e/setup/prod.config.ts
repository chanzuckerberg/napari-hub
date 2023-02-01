import { devices, PlaywrightTestConfig } from '@playwright/test';
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
  fullyParallel: true,
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: '../report/test-results.json',
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
        locale: 'en-US',
        timezoneId: 'America/New_York',
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
// eslint-disable-next-line import/no-default-export
export default config;
