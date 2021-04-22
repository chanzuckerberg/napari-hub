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
      backgroundColor: {
        'napari-primary': '#80d1ff',
      },

      fontSize: {
        'napari-app-bar': 'clamp(11px, 3.5vw, 17px)',
      },

      margin: {
        'napari-sm': '25px',
        'napari-lg': '50px',
      },

      width: (theme) => ({
        'napari-xs': theme('screens.xs'),
        'napari-center-col': '775px',
      }),

      height: {
        'napari-app-bar': '75px',
      },

      gridTemplateColumns: {
        'napari-nav-mobile': 'min-content 1fr',
        'napari-2-col': '225px 775px',
        'napari-3-col': '225px 775px 225px',
      },

      gap: (theme) => theme('margin'),
      maxWidth: (theme) => theme('width'),
      minWidth: (theme) => theme('width'),
      padding: (theme) => theme('margin'),
    },
  },
};
