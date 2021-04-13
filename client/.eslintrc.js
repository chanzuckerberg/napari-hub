/**
 * ESLint configuration for napari hub client. All client code is linted using
 * this configuration. That includes JS tooling modules, configuration scripts
 * (next.config.js, plopfile.js, etc.), E2E tests, and application source code.
 *
 * Files with specific configurations are handled using the ESLint `overrides`
 * feature. We use overrides over nested `.eslintrc.js` files (for example
 * `src/.eslintrc.js` and `src/pages/.eslintrc.js`) to make this configuration
 * file the Single Source of Truth for ESLint configuration.
 */

const configs = {
  dev: require.resolve('./eslint/dev'),
  e2e: require.resolve('./eslint/e2e'),
  react: require.resolve('./eslint/react'),
  tests: require.resolve('./eslint/tests'),
  typescript: require.resolve('./eslint/typescript'),
};

module.exports = {
  root: true,
  extends: ['airbnb/base', 'prettier', configs.dev],
  plugins: ['simple-import-sort'],

  overrides: [
    // TypeScript scripts
    {
      files: ['*.ts'],
      extends: [configs.typescript, configs.dev],
    },

    // Unit tests
    {
      files: ['./src/**/*.test.ts{,x}', './jest/**/*.ts'],
      extends: [configs.typescript, configs.react, configs.dev, configs.tests],
    },

    // E2E tests
    {
      files: ['./tests/**/*.ts'],
      extends: [configs.typescript, configs.dev, configs.e2e],
    },

    // TypeScript and React source code.
    {
      files: ['./src/**/*.ts{,x}'],
      extends: [configs.typescript, configs.react],
    },

    /*
      Disable explicit return types for TSX files. Prefer inferred return
      types for React component:
      https://kentcdodds.com/blog/how-to-write-a-react-component-in-typescript
    */
    {
      files: ['./src/**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },

    /*
      Prefer default exports for Next.js pages and SCSS modules.

      Next.js routing needs the pages to be exported as default exports, and
      the team has no plans to add support for the time being:
      https://github.com/vercel/next.js/issues/7275

      SCSS modules export from the `default` export, so their type
      definitions are generated using `export default styles`.
    */
    {
      files: ['./src/pages/**/*.tsx', './src/**/*.module.scss.d.ts'],
      rules: {
        'import/no-default-export': 'off',
        'import/prefer-default-export': 'error',
      },
    },
  ],
};
