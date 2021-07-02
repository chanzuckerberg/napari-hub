const { resolve } = require('path');

const pkg = require('../package.json');

module.exports = {
  parserOptions: {
    project: resolve(__dirname, '../tsconfig.jest.json'),
  },

  extends: ['plugin:jest/recommended', 'plugin:jest/style'],

  settings: {
    /*
      Jest version has to be passed explicitly because ESlint throws an error
      about not being able to find the Jest version. This is likely due to
      the frontend being stored in `frontend/`.
      https://git.io/JYhAJ
    */
    jest: {
      version: pkg.devDependencies.jest,
    },
  },
};
