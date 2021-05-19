/**
 * Returns transform imports plugin with configuration depending on the entry
 * type. This is required because Next.js transpiles ES modules for the client,
 * but it does not transpile for the server. This is fine because we only need
 * transpililng of ES modules on the client for tree shaking.
 *
 * @param {'client' | 'server'} name The name of the entry
 * @returns Babel plugin config
 */
function getMUIImportsPlugin(name) {
  let path = '${member}';

  // Prefix with `esm` path to use ESM version of MUI.
  if (name === 'client') {
    path = `esm/${path}`;
  }

  return [
    'babel-plugin-transform-imports',
    {
      '@material-ui/core': {
        transform: `@material-ui/core/${path}`,
        preventFullImport: true,
      },
      '@material-ui/icons': {
        transform: `@material-ui/icons/${path}`,
        preventFullImport: true,
      },
    },
  ];
}

module.exports = {
  presets: ['next/babel'],

  env: {
    client: {
      plugins: [getMUIImportsPlugin('client')],
    },

    server: {
      plugins: [getMUIImportsPlugin('server')],
    },
  },
};
