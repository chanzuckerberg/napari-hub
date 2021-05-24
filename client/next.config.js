const mdx = require('@next/mdx');

const withMDX = mdx({
  extensions: /\.mdx$/,
});

module.exports = withMDX({
  pageExtensions: ['ts', 'tsx', 'mdx'],

  // Enable webpack 5 support for faster builds :)
  // https://nextjs.org/docs/messages/webpack5
  future: {
    webpack5: true,
  },

  webpack(config, { isServer }) {
    // Sets BABEL_ENV to `client` or `server` depending on the Next.js build.
    // This is required for the Material UI + babel import plugin to work.
    process.env.BABEL_ENV = config.name;

    if (!isServer) {
      config.resolve.alias.lodash = require.resolve('lodash-es');
    }

    return config;
  },
});
