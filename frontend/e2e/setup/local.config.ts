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
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        video: 'on',
      },
    },
  ],
  reporter: 'list',
  testDir: '../tests',
  timeout: 30 * 1000,
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on',
  },
};
export default config;
