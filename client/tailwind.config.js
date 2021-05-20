const { reduce } = require('lodash');
const typography = require('@tailwindcss/typography');

const breakpoints = require('./breakpoints');

// Add px unit to all breakpoint values.
const screens = reduce(
  breakpoints,
  (result, value, key) => {
    result[key] = `${value}px`;
    return result;
  },
  {},
);

function pixelsToRem(value) {
  return `${value / 16}rem`;
}

module.exports = {
  mode: 'jit',
  darkMode: 'media',
  purge: ['./src/**/*.{mdx,tsx,scss}'],
  plugins: [typography],
  theme: {
    screens,
    extend: {
      spacing: {
        // Use 25px and 50px for margins, paddings, gaps, etc.
        6: pixelsToRem(25),
        12: pixelsToRem(50),
      },

      colors: {
        'napari-primary': '#80d1ff',
        'napari-hover': '#98daff',
        'napari-hover-gray': '#f7f7f7',
        'napari-light': '#d2efff',
      },

      width: (theme) => ({
        'napari-xs': theme('screens.xs'),
        'napari-col': '225px',
      }),

      height: {
        'napari-app-bar': '75px',
      },

      gridTemplateColumns: (theme) => {
        const width = theme('width.napari-col');
        const columns = [2, 3, 4, 5];

        return columns.reduce(
          // Add `repeat(225px, $column)` for each column
          (result, count) => {
            result[`napari-${count}`] = `repeat(${count}, ${width})`;
            return result;
          },

          {},
        );
      },

      maxWidth: (theme) => theme('width'),
      minWidth: (theme) => theme('width'),
    },
  },
};
