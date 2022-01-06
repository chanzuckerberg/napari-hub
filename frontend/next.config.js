const mdx = require('@next/mdx');
const slug = require('remark-slug');
const html = require('rehype-stringify');
const externalLinks = require('remark-external-links');
const { EnvironmentPlugin } = require('webpack');

const linkvars = require('./src/utils/linkvars');
const { LINKS } = require('./src/constants');
const { i18n } = require('./next-i18next.config');

const withMDX = mdx({
  extensions: /\.mdx$/,
  options: {
    remarkPlugins: [
      slug,
      html,
      [externalLinks, { target: '_blank', rel: 'noreferrer' }],
      [linkvars, { vars: LINKS }],
    ],
  },
});

const { PREVIEW } = process.env;
const PROD = process.env.NODE_ENV === 'production';

// Enable static HTML export of the preview page in production and if the
// preview file is provided.
const previewOptions =
  PROD && PREVIEW
    ? {
        // The Image API doesn't work for exported apps, so we need to use a
        // different image loader to supplement it. The workaround is to use imgix
        // with a root path for Next.js v10: https://git.io/J0k6G.
        images: {
          loader: 'imgix',
          path: process.env.BASE_PATH || '/',
        },

        // Override default pages being exported to be only the preview page:
        // https://stackoverflow.com/a/64071979
        exportPathMap() {
          return {
            '/preview': { page: '/preview' },
          };
        },
      }
    : {};

if (PROD && PREVIEW) {
  console.log('Building preview page for plugin file', PREVIEW);
}

module.exports = withMDX({
  ...previewOptions,
  i18n,

  basePath: process.env.BASE_PATH || '',
  pageExtensions: ['ts', 'tsx', 'mdx'],

  // Use SWC to minify code.
  swcMinify: true,

  webpack(config, { isServer }) {
    // Sets BABEL_ENV to `<[server|client]-[dev|prod]>` depending on the Next.js
    // build.  This is required for the Material UI + babel import plugin to work.
    const env = PROD ? 'prod' : 'dev';
    process.env.BABEL_ENV = `${config.name}-${env}`;

    if (!isServer) {
      config.resolve.alias.lodash = require.resolve('lodash-es');
    }

    config.plugins.push(
      new EnvironmentPlugin({
        BASE_PATH: '',

        // Path to JSON file that has the same structure as the backend's plugin
        // response data. When this is defined, the UI will switch into preview
        // mode and render the /preview page with the data in this JSON file.
        PREVIEW: '',

        // A link to the pull request that created the current preview page.
        PREVIEW_PULL_REQUEST: '',

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
      }),
    );

    return config;
  },
});
