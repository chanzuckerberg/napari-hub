const typography = require('@tailwindcss/typography');

/*
  The VSCode Tailwind Intellisense extension is broken for configs that use
  `mode: 'jit'`, making the autocomplete for Tailwind useless.

  To get around this, we check for environment variable `TAILWIND_JIT` to
  determine the mode for the Tailwind config. As a result, VSCode will load
  the config without a problem and the dev server can take advantage of the
  JIT performance benefits .

  TODO Remove this code when this issue is resolved:
  https://github.com/tailwindlabs/tailwindcss-intellisense/issues/293
*/
let mode;
if (process.env.TAILWIND_JIT) {
  mode = 'jit';
}

module.exports = {
  mode,
  darkMode: 'media',
  purge: ['./src/**/*.{ts,tsx,scss}'],
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

      height: {
        'napari-app-bar': '75px',
      },

      gridTemplateColumns: {
        'napari-2-col': '225px 775px',
        'napari-3-col': '225px 775px 225px',
      },

      gap: (theme) => theme('margin'),
    },
  },
};
