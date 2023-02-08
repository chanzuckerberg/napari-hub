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
    'playwright/no-element-handle': 'off',
    'playwright/no-wait-for-timeout': 'off',
  },
};
