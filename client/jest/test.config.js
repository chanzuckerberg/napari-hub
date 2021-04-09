module.exports = {
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',

    /*
      `identity-obj-proxy` returns a string for whatever key you use, so we use
      it for SCSS modules since components use the exports to assign class
      names.
    */
    '^.+\\.module\\.scss$': 'identity-obj-proxy',
  },

  transform: {
    '\\.tsx?$': 'babel-jest',
  },
};
