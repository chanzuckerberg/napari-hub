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

function remToPixels(value) {
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
        6: remToPixels(25),
        12: remToPixels(50),
      },

      colors: {
        'napari-primary': '#80d1ff',
        'napari-primary-light': 'rgba(128, 215, 255, 0.25)',
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
        const columns = [3, 4, 5];

        return columns.reduce(
          // Add `repeat(225px, $column)` for each column
          (result, count) => {
            result[`napari-${count}`] = `repeat(${count}, ${width})`;
            return result;
          },

          {
            // Use fractional width for 2-column layout
            // https://css-tricks.com/introduction-fr-css-unit/
            'napari-2': 'repeat(2, 1fr)',
          },
        );
      },

      maxWidth: (theme) => theme('width'),
      minWidth: (theme) => theme('width'),
    },
  },
};
