import { devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../', '.env'),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 120000,
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
  timeout: 60 * 1000,
  use: {
    actionTimeout: 3000,
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on',
  },
};
// eslint-disable-next-line import/no-default-export
export default config;
