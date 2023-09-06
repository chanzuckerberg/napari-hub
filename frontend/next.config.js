const { EnvironmentPlugin } = require('webpack');

const { i18n } = require('./next-i18next.config');

const PROD = process.env.NODE_ENV === 'production';

console.log('Building frontend');
console.log(`NODE_ENV=${process.env.NODE_ENV}`);
console.log(`ENV=${process.env.ENV}`);

module.exports = {
  i18n,

  productionBrowserSourceMaps: true,
  basePath: process.env.BASE_PATH || '',
  pageExtensions: ['ts', 'tsx'],

  // Use SWC to minify code.
  swcMinify: true,

  // TODO Re-enable font optimization until it's fixed for Next.js v12.1:
  // https://github.com/vercel/next.js/issues/36498
  optimizeFonts: false,

  images: {
    domains: ['raw.githubusercontent.com', 'github.com'],
  },

  webpack(config, { isServer }) {
    // Sets BABEL_ENV to `<[server|client]-[dev|prod]>` depending on the Next.js
    // build.  This is required for the Material UI + babel import plugin to work.
    const env = PROD ? 'prod' : 'dev';
    process.env.BABEL_ENV = `${config.name}-${env}`;

    config.plugins.push(
      new EnvironmentPlugin({
        BASE_PATH: '',

        // Environment variable for current deployment environment (possible
        // values are local, dev, staging, and prod) If an `ENV` variable is not
        // defined, the value `local` is used by default (for example when
        // running `yarn dev`).
        ENV: 'local',

        // Environment variable for enabling plausible analytics. By default,
        // analytics are enabled for production and staging deployments, but can
        // be enabled manually for testing.
        PLAUSIBLE: JSON.stringify(
          ['prod', 'staging'].includes(process.env.ENV),
        ),

        // Add `API_URL` to client at build time so that it can make requests to
        // the API directly.
        ...(isServer
          ? {}
          : {
              API_URL: 'http://localhost:8081',
            }),
      }),
    );

    return config;
  },
};
