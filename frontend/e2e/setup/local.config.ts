import { devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../', '.env'),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  globalSetup: './globalSetup',
  outputDir: '../report',
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
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:8080/',
        video: 'on',
        locale: 'en-US',
        timezoneId: 'America/New_York',
      },
    },
  ],
  testDir: '../tests',
  timeout: 60 * 1000,
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'on',
  },
};
// eslint-disable-next-line import/no-default-export
export default config;
