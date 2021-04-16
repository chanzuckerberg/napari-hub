const mdx = require('@next/mdx');

const withMDX = mdx({
  extensions: /\.mdx$/,
});

module.exports = withMDX({
  pageExtensions: ['tsx', 'mdx'],

  // Enable webpack 5 support for faster builds :)
  // https://nextjs.org/docs/messages/webpack5
  future: {
    webpack5: true,
  },
});
