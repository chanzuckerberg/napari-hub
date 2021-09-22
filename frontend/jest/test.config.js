module.exports = {
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/jest/setupTests.ts'],
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],

  moduleNameMapper: {
    /*
      `identity-obj-proxy` returns a string for whatever key you use, so we use
      it for SCSS modules since components use the exports to assign class
      names.
    */
    '^.+\\.module\\.scss$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  transform: {
    '\\.tsx?$': 'babel-jest',
  },
};
