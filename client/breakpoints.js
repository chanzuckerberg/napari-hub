/**
 * Breakpoints defined in JS so that it can be used in the client and Tailwind
 * configuration at build time.
 */

module.exports = {
  // Special screen size for fresnel when using `lessThan` queries.
  zero: 0,
  'screen-300': 300,
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
