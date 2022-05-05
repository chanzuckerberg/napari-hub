const { resolve } = require('path');
const config = require('eslint-config-airbnb-base/rules/style');

module.exports = {
  parserOptions: {
    project: resolve(__dirname, '../tsconfig.json'),
  },

  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:@next/next/recommended',
  ],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },

    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          resolve(__dirname, '../tsconfig.json'),
          resolve(__dirname, '../tsconfig.jest.json'),
        ],
      },
    },
  },

  plugins: ['simple-import-sort', 'unused-imports'],

  rules: {
    // It's helpful to split functionality into multiple functions within a class.
    'class-methods-use-this': 'off',

    // Throws errors for exported functions, which is a common pattern with ES modules.
    '@typescript-eslint/unbound-method': 'off',

    // Named exports are nicer to work with for a variety of reasons:
    // https://basarat.gitbook.io/typescript/main-1/defaultisbad
    'import/no-default-export': 'error',
    'import/prefer-default-export': 'off',

    // Let ESlint sort our imports for us so we don't have to think about it.
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',

    // Allow for-of loops since most browsers support it now.
    'no-restricted-syntax': config.rules['no-restricted-syntax'].filter(
      (rule) => rule.selector !== 'ForOfStatement',
    ),

    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
};
