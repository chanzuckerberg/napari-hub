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
 * Mapping of naapri hub breakpoints to devices that fit within the dimensions
 * of its associated breakpoint. We only need the devices for the viewport
 * widths so we can test functional and layout changes in the UI.
 *
 */

const DEVICES = {
  //  width = 320px > 300px = sm
  xs: 'iPhone SE',

  // width = 414px > 375px
  sm: 'iPhone 11 Pro Max',

  // width = 568px > 495px = md
  md: 'iPhone SE landscape',

  // width = 768px > 600px = lg
  lg: 'iPad Mini',

  // width = 104px > 875px = xl
  xl: 'iPad Mini landscape',

  // width = 1194px > 1150px = 2xl
  '2xl': 'iPad Pro 11 landscape',

  // width = 1920px > 1425px = 3xl
  '3xl': {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
  },
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
      browsers: [BROWSER],
      browserContext: 'incognito',
      devices: Object.values(DEVICES),
      contextOptions: DEFAULT_CONTEXT_CONFIG,
      launchOptions: DEFAULT_LAUNCH_CONFIG,
    },
  },

  transform: {
    '\\.tsx?$': 'babel-jest',
  },
};
