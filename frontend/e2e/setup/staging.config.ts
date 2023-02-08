import { devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../', '.env'),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 60000,
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
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        video: 'on',
      },
    },
    {
      name: 'Screen-300',
      use: {
        browserName: 'chromium',
        viewport: { width: 300, height: 650 },
        video: 'on',
      },
    },
    {
      name: 'Screen-600',
      use: {
        browserName: 'chromium',
        viewport: { width: 600, height: 920 },
        video: 'on',
      },
    },
    {
      name: 'Screen-875',
      use: {
        browserName: 'chromium',
        viewport: { width: 875, height: 415 },
        video: 'on',
      },
    },
    {
      name: 'Screen-1150',
      use: {
        browserName: 'chromium',
        viewport: { width: 1150, height: 712 },
        video: 'on',
      },
    },
    {
      name: 'Screen-1425',
      use: {
        browserName: 'chromium',
        viewport: { width: 1425, height: 1080 },
        video: 'on',
      },
    },
  ],
  testDir: '../tests',
  timeout: 30 * 1000,
  use: {
    actionTimeout: 0,
    baseURL: 'https://staging.napari-hub.org/',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on',
  },
};
// eslint-disable-next-line import/no-default-export
export default config;
