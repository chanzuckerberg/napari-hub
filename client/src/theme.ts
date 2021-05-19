import { createMuiTheme } from '@material-ui/core/styles';

import colors from '@/colors';

export const theme = createMuiTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.light,
    },
  },

  typography: {
    fontFamily: 'Barlow',
    button: {
      // Remove uppercase styling from buttons
      textTransform: 'none',
    },
  },
});
