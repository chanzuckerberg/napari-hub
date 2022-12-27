module.exports = {
  extends: ['plugin:playwright/playwright-test'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        optionalDependencies: true,
        peerDependencies: true,
      },
    ],
    'no-await-in-loop': 'off',
    'playwright/no-element-handle': 'off',
    'playwright/no-wait-for-timeout': 'off',
    'no-explicit-any': 'off',
    'import/no-default-export': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'no-plusplus': 'off',
    'no-else-return': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'playwright/no-focused-test': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
  },
};
