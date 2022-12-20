import { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../', '.env'),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  outputDir: '../report',
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
        open: 'on-failure',
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
        video: 'on',
      },
    },
  ],
  testDir: '../tests',
  timeout: 30 * 1000,
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on',
  },
};
export default config;
