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

module.exports = {
  rootDir: '..',
  preset: 'jest-playwright-preset',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],

  moduleNameMapper: {
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },

  setupFilesAfterEnv: [
    'expect-playwright',
    '<rootDir>/jest/playwright.setup.ts',
  ],

  testEnvironmentOptions: {
    'jest-playwright': {
      browserContext: 'incognito',
      contextOptions: DEFAULT_CONTEXT_CONFIG,
      launchOptions: DEFAULT_LAUNCH_CONFIG,
    },
  },

  transform: {
    '\\.tsx?$': 'babel-jest',
  },
};
