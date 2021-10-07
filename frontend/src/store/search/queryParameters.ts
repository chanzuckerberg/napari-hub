import { set } from 'lodash';
import { snapshot, subscribe } from 'valtio';

import { BEGINNING_PAGE, RESULTS_PER_PAGE } from '@/constants/search';
import { isSearchPage } from '@/utils';

import { SearchQueryParams, SearchSortType } from './constants';
import { searchFormStore } from './form.store';
import { searchResultsStore } from './results.store';

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
 * Flag for disabling the query parameter update phase. This will prevent the
 * URL query parameters from being updated when this is `true`.
 */
let skipQueryParamUpdate = false;

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

  // Flag for if at least one filter is enabled.
  let isFilterEnabled = false;

  forEachFilterParam(({ key, value, stateKey, filterKey }) => {
    if (params.getAll(key).includes(value)) {
      set(searchFormStore.filters, [filterKey, stateKey], true);

      if (!isFilterEnabled) {
        isFilterEnabled = true;
      }
    }
  });

  // Set page value if page parameter is available. If the value is a
  // non-number, use the initial page value.
  const pageStr = params.get(SearchQueryParams.Page) ?? '';
  const page = +pageStr;

  /**
   * Helper for setting the page state while respecting the upper limit of pages.
   *
   * @param totalPages The max number of pages allowed.
   */
  function setPageState(totalPages: number) {
    if (page > totalPages) {
      searchFormStore.page = totalPages;
    } else {
      searchFormStore.page = page;
    }
  }

  // Do not update page state if the page query parameter is not set or if it's
  // already set to the beginning page.
  if (pageStr && page !== BEGINNING_PAGE) {
    // If the page number is not a number or less than the beginning page, then
    // set it to the beginning page.
    if (Number.isNaN(page) || page < BEGINNING_PAGE) {
      searchFormStore.page = BEGINNING_PAGE;
    } else if (
      // If a query or filter is provided, then the `totalPages` state can only be
      // calculated using the derived state of the `searchResultStore`.
      query ||
      isFilterEnabled
    ) {
      // Skip query parameter updates while we wait for the `totalPages` state
      // to be ready.
      skipQueryParamUpdate = true;

      // Create a one-time subscriber so that we can read the `totalPages` state
      // when it's available. Because of the delay, there will be a minor flash
      // in the query page parameters
      const unsubscribe = subscribe(searchResultsStore, () => {
        const { totalPages } = snapshot(searchResultsStore).results;
        setPageState(totalPages);
        unsubscribe();
        skipQueryParamUpdate = false;
      });
    } else {
      const totalPages = Math.ceil(
        searchFormStore.search.index.length / RESULTS_PER_PAGE,
      );

      setPageState(totalPages);
    }
  }
}

/**
 * Updates the URL query parameters using the search form state.  On initial
 * load, some query parameters (page, sort type) will not have the query
 * parameters added (unless explicitly set by the user) because it looks nicer
 * to land on `https://napari-hub.org` instead of
 * `https://napari-hub.org/?sortType=recentlyUpdated&page=1`.
 *
 * @param initialLoad Whether this is the first time the page is loading.
 */
function updateQueryParameters(initialLoad?: boolean) {
  if (!isSearchPage(window.location.pathname) || skipQueryParamUpdate) {
    return;
  }

  const fullUrl = new URL(window.location.href);
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
  // Don't set sort type on initial load unless a value is already specified.
  if (!initialLoad || fullUrl.searchParams.get(SearchQueryParams.Sort)) {
    const { sort } = searchFormStore;
    params.set(SearchQueryParams.Sort, sort);
  }

  // Filters
  forEachFilterParam(({ key, value, state }) => {
    if (typeof state === 'boolean' && state) {
      params.append(key, value);
    }
  });

  // Current page.
  // Don't set query parameter on initial load unless a value is already specified.
  if (!initialLoad || fullUrl.searchParams.get(SearchQueryParams.Page)) {
    params.set(SearchQueryParams.Page, String(searchFormStore.page));
  }

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
  updateQueryParameters(true);

  const unsubscribe = subscribe(
    searchFormStore,
    updateQueryParameters.bind(null, false),
  );
  return unsubscribe;
}
