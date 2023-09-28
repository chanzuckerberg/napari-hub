import { proxy } from 'valtio';

/**
 * Store for holding state related to page transitions
 */
export const pageTransitionsStore = proxy({
  loading: false,
  nextUrl: '',
});
