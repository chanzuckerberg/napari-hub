const path = require('path');

module.exports = {
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
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  globals: {
    'ts-jest': {
      tsconfig: path.resolve(__dirname, '../e2e/tsconfig.json'),
    },
  },

  transform: {
    '\\.tsx?$': 'ts-jest',
  },
};
