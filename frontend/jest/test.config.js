const { createConfig } = require('./createConfig');

module.exports = createConfig({
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    /*
      `identity-obj-proxy` returns a string for whatever key you use, so we use
      it for SCSS modules since components use the exports to assign class
      names.
    */
    '^.+\\.module\\.scss$': 'identity-obj-proxy',
    '^@/i18n/(.*)$': '<rootDir>/i18n/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
});
