const { createConfig } = require('./createConfig');

module.exports = createConfig({
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.ts'],
  testEnvironment: 'jsdom',

  // Disable markdown tests for now until Jest supports ES modules natively:
  // https://github.com/facebook/create-react-app/issues/11946#issuecomment-1045155651
  // testMatch: ['<rootDir>/src/**/*.test.ts'],
  testMatch: [`<rootDir>/src/**/(?!Markdown|Markdown.utils)*.test.ts?(x)`],
  moduleNameMapper: {
    /*
      `identity-obj-proxy` returns a string for whatever key you use, so we use
      it for SCSS modules since components use the exports to assign class
      names.
    */
    '^.+\\.module\\.scss$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
});
