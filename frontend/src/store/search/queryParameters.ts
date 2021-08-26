import { set } from 'lodash';
import { subscribe } from 'valtio';

import { isSearchPage } from '@/utils';

import { SearchQueryParams, SearchSortType } from './constants';
import { searchFormStore } from './form.store';

export const PARAM_KEY_MAP: Record<string, string | undefined> = {
  operatingSystems: 'operatingSystem',
  pythonVersions: 'python',
};

export const PARAM_VALUE_MAP: Record<string, string | undefined> = {
  openSource: 'oss',
};

interface ForEachFilterParamCallbackOptions {
  filterKey: string;
  key: string;
  state: unknown;
  stateKey: string;
  value: string;
}

/**
 * Utility function for iterating through all filter states with relevant data.
 * This includes the state keys, parameter names / values, and the state value.
 *
 * @param callback The callback to call :)
 */
function forEachFilterParam(
  callback: (options: ForEachFilterParamCallbackOptions) => void,
) {
  for (const [filterKey, store] of Object.entries(searchFormStore.filters)) {
    for (const [stateKey, state] of Object.entries(store)) {
      const key = PARAM_KEY_MAP[filterKey] ?? filterKey;
      const value = PARAM_VALUE_MAP[stateKey] ?? stateKey;
      callback({
        filterKey,
        key,
        state,
        stateKey,
        value,
      });
    }
  }
}

/**
 * Parses the URL query parameters for initial state. This should only happen
 * once on initial load.
 */
function initStateFromQueryParameters() {
  const params = new URL(window.location.href).searchParams;

  const query = params.get(SearchQueryParams.Search);
  if (query && searchFormStore.search.query !== query) {
    searchFormStore.search.query = query;
  }

  const sort = params.get(SearchQueryParams.Sort);
  if (sort) {
    searchFormStore.sort = sort as SearchSortType;
  } else if (query) {
    // Set sort type to relevance if the search query is present but the sort
    // type isn't.
    searchFormStore.sort = SearchSortType.Relevance;
  }

  forEachFilterParam(({ key, value, stateKey, filterKey }) => {
    if (params.getAll(key).includes(value)) {
      set(searchFormStore.filters, [filterKey, stateKey], true);
    }
  });
}

/**
 * Updates the URL query parameters using the search form state.
 */
function updateQueryParameters() {
  if (!isSearchPage(window.location.pathname)) {
    return;
  }

  const url = new URL(window.location.origin);
  const params = url.searchParams;

  // Search query
  const { query } = searchFormStore.search;
  if (query) {
    params.set(SearchQueryParams.Search, query);
  } else {
    params.delete(SearchQueryParams.Search);
  }

  // Sort type
  const { sort } = searchFormStore;
  params.set(SearchQueryParams.Sort, sort);

  // Filters
  forEachFilterParam(({ key, value, state }) => {
    if (typeof state === 'boolean' && state) {
      params.append(key, value);
    }
  });

  const nextUrl = url.href;
  if (window.location.href !== nextUrl) {
    window.history.replaceState(
      {
        // Pass existing history state because next.js stores data in here.
        // Without, the back / forward functionality will be broken:
        // https://github.com/vercel/next.js/discussions/18072
        ...window.history.state,
        as: nextUrl,
        url: nextUrl,
      },
      '',
      nextUrl,
    );
  }
}

/**
 * Initializes the search form state from query parameters and adds a state
 * subscriber to update the query parameters whenever the form state changes.
 *
 * @returns A function that can be used to unsubscribe the listener.
 */
export function initQueryParameterListener(): () => void {
  initStateFromQueryParameters();
  const unsubscribe = subscribe(searchFormStore, updateQueryParameters);
  return unsubscribe;
}
