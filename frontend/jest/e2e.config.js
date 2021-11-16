const { set } = require('lodash');
const { createConfig } = require('./createConfig');
const { breakpoints } = require('../src/theme');

const isHeadful =
  process.env.HEADFUL === 'true' || process.env.HEADLESS === 'false';

const DEFAULT_LAUNCH_CONFIG = {
  args: ['--ignore-certificate-errors', '--ignore-ssl-errors'],
  headless: !isHeadful,
  ignoreHTTPSErrors: true,
};

const DEFAULT_CONTEXT_CONFIG = {
  acceptDownloads: true,
};

const BROWSER = process.env.BROWSER || 'chromium';

/**
 * Subset of breakpoints to use for E2E testing because running tests for every
 * breakpoint would be expensive and make PR checks super slow.
 */
const ALLOWED_SCREENS = new Set([
  'screen-300',
  'screen-600',
  'screen-875',
  'screen-1150',
  'screen-1425',
]);

/**
 * Mapping of naapri hub breakpoints to devices that fit within the dimensions
 * of its associated breakpoint. We only need the devices for the viewport
 * widths so we can test functional and layout changes in the UI.
 */
const DEVICES = Object.entries(breakpoints)
  .filter(([name]) => ALLOWED_SCREENS.has(name))
  .reduce(
    (result, [name, width]) =>
      set(result, name, {
        name,
        viewport: { width, height: 1440 },
      }),
    {},
  );

/**
 * Screen specific environment variable. Use if you want to test using a specific screen.
 */
const { SCREEN } = process.env;

module.exports = createConfig({
  rootDir: '..',
  preset: 'jest-playwright-preset',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],

  moduleNameMapper: {
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: [
    'expect-playwright',
    '<rootDir>/jest/playwright.setup.ts',
  ],

  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: [BROWSER],
      browserContext: 'incognito',
      devices: SCREEN ? [DEVICES[`screen-${SCREEN}`]] : Object.values(DEVICES),
      contextOptions: DEFAULT_CONTEXT_CONFIG,
      launchOptions: DEFAULT_LAUNCH_CONFIG,
    },
  },
});
