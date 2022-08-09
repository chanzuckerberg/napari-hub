import { createTheme, ThemeOptions } from '@mui/material/styles';
import { defaultAppTheme, makeThemeOptions } from 'czifui';

import { colors } from './colors';
import { fontFamily } from './fontFamily';

const appTheme = makeThemeOptions(defaultAppTheme);
export const theme = createTheme({
  ...appTheme,

  palette: {
    ...appTheme.palette,

    primary: {
      main: colors.primary,
      light: colors.light,
      error: colors.error,
    },
  },

  shape: {
    ...appTheme.shape,

    // Disable rounded borders for buttons, dialogs, etc.
    borderRadius: 0,
  },

  typography: {
    ...appTheme.typography,

    fontFamily: fontFamily.join(','),
    button: {
      // Remove uppercase styling from buttons
      textTransform: 'none',
    },
  },
} as ThemeOptions);
