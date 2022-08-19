const { reduce } = require('lodash');
const typography = require('@tailwindcss/typography');
const sds = require('czifui/dist/tailwind.json');

const { breakpoints } = require('./src/theme/breakpoints');
const { colors } = require('./src/theme/colors');
const { fontFamily } = require('./src/theme/fontFamily');

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
  content: ['./src/**/*.{mdx,tsx,scss}'],
  plugins: [typography],
  important: '#napari-hub',
  theme: {
    screens,
    extend: {
      ...sds,

      fontFamily: {
        barlow: fontFamily,
        jetbrains: 'JetBrains Mono, monospace',
      },

      spacing: {
        ...sds.spacing,
        // Use 25px and 50px for margins, paddings, gaps, etc.
        6: pixelsToRem(25),
        12: pixelsToRem(50),
      },

      colors: {
        'napari-hover': colors.hover,
        'napari-error': colors.error,
        'napari-gray': colors.gray,
        'napari-dark-gray': colors.darkGray,
        'napari-preview-gray': colors.previewGray,
        'napari-preview-orange': colors.previewOrange,
        'napari-preview-orange-overlay': colors.previewOrangeOverlay,
        'napari-preview-orange-overlay-active':
          colors.previewOrangeOverlayActive,
        'napari-category-blue': colors.categoryBlue,

        'hub-gray': {
          100: '#f7f7f7',
          200: '#eaeaea',
          300: '#cccccc',
          400: '#999999',
          500: '#686868',
        },

        'hub-primary': {
          100: '#ecf8ff',
          200: '#d2efff',
          400: '#80d1ff',
          500: '#68c8ff',
          600: '#686868',
        },
      },

      width: (theme) => ({
        ...sds.height,
        'napari-xs': theme('screens.xs'),
        'napari-col': pixelsToRem(225),
      }),

      height: {
        ...sds.width,
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
      minHeight: (theme) => theme('height'),
    },
  },
};
