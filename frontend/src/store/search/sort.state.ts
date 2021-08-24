import { atomWithQueryParameter } from '@/utils/state';

import { DEFAULT_SORT_TYPE, SearchQueryParams } from './constants';

export const sortTypeState = atomWithQueryParameter(DEFAULT_SORT_TYPE, {
  paramName: SearchQueryParams.Sort,
});
