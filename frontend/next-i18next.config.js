const path = require('path');

module.exports = {
  // Location of locale files.
  localePath: path.resolve(__dirname, 'i18n'),

  // Updating i18n JSON files will reload on pre-render. Unfortunately, this is
  // not supported by Fast Refresh, so editing an i18n file requires a full
  // browser reload.
  reloadOnPrerender: true,

  // t() will support returning full objects / arrays.
  returnObjects: true,

  i18n: {
    defaultLocale: 'en',

    // Supported locales. When adding a new locale, add the language code here
    // and copy the `src/locales/en` directory to a new directory matching the
    // new locale's language code.
    locales: ['en'],
  },
};
