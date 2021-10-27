/**
 * Shared module for Tailwind and Material UI. This is written in JS so that the
 * Tailwind config can import it in a Node.js environment.
 */

const createTheme = require('@material-ui/core/styles/createTheme').default;

const colors = {
  primary: '#80d1ff',
  hover: '#98daff',
  hoverGray: '#f7f7f7',
  gray: '#6f6f6f',
  darkGray: '#686868',
  light: '#d2efff',
  error: '#eb1000',
  previewGray: '#ededed',
  previewOrange: '#d85e38',
  previewOrangeOverlay: 'rgba(216, 94, 56, 0.1)',
};

const breakpoints = {
  // Special screen size for fresnel when using `lessThan` queries.
  zero: 0,
  'screen-300': 300, // if there's a smaller breakpoint, update global.scss
  'screen-375': 375,
  'screen-495': 495,
  'screen-550': 550,
  'screen-560': 560,
  'screen-600': 600,
  'screen-655': 655,
  'screen-725': 725,
  'screen-875': 875,
  'screen-1150': 1150,
  'screen-1425': 1425,

  // TODO Remove when breakpoint existing usages are renamed.
  xs: 300,
  sm: 375,
  md: 495,
  lg: 600,
  xl: 875,
  '2xl': 1150,
  '3xl': 1425,
};

const fontFamily = ['Barlow', 'sans-serif'];

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.light,
      error: colors.error,
    },
  },

  shape: {
    // Disable rounded borders for buttons, dialogs, etc.
    borderRadius: 0,
  },

  typography: {
    fontFamily: fontFamily.join(','),
    button: {
      // Remove uppercase styling from buttons
      textTransform: 'none',
    },
  },
});

module.exports = {
  breakpoints,
  colors,
  fontFamily,
  theme,
};
