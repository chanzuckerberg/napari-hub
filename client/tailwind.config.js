const typography = require('@tailwindcss/typography');

module.exports = {
  mode: 'jit',
  darkMode: 'media',
  purge: ['./src/**/*.{mdx,tsx,scss}'],
  plugins: [typography],
  theme: {
    screens: {
      xs: '300px',
      sm: '375px',
      md: '495px',
      lg: '600px',
      xl: '875px',
      '2xl': '1150px',
      '3xl': '1425px',
    },

    extend: {
      colors: {
        'napari-primary': '#80d1ff',
      },

      width: (theme) => ({
        'napari-xs': theme('screens.xs'),
        'napari-center-col': '775px',
        'napari-side-col': '225px',
      }),

      height: {
        'napari-app-bar': '75px',
      },

      gridTemplateColumns: (theme) => ({
        'napari-nav-mobile': 'min-content 1fr',

        'napari-2-col': [
          theme('width.napari-center-col'),
          theme('width.napari-side-col'),
        ].join(' '),

        /*
          App bar 2 column layout is reversed because the logo needs to be
          smaller than the search container.
        */
        'napari-app-bar-2-col': [
          theme('width.napari-side-col'),
          theme('width.napari-center-col'),
        ].join(' '),

        'napari-3-col': [
          theme('width.napari-side-col'),
          theme('width.napari-center-col'),
          theme('width.napari-side-col'),
        ].join(' '),
      }),

      maxWidth: (theme) => theme('width'),
      minWidth: (theme) => theme('width'),
    },
  },
};
