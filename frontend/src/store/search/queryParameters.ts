/* eslint-disable no-param-reassign */

import { set } from 'lodash';
import { snapshot, subscribe } from 'valtio';

import { BEGINNING_PAGE, RESULTS_PER_PAGE } from '@/constants/search';
import { createUrl, replaceUrlState } from '@/utils';

import { SearchQueryParams, SearchSortType } from './constants';
import { PluginSearchResultStore } from './results.store';
import type { PluginSearchStore } from './search.store';
import { forEachFilterParam } from './utils';

/**
 * Parses the URL query parameters for initial state. This should only happen
 * once on initial load.
 */
export function initStateFromQueryParameters(
  searchStore: PluginSearchStore,
  resultsStore: PluginSearchResultStore,
  url: string,
) {
  const params = createUrl(url).searchParams;

  const query = params.get(SearchQueryParams.Search);
  if (query && searchStore.search.query !== query) {
    searchStore.search.query = query;
  }

  const sort = params.get(SearchQueryParams.Sort);
  if (sort) {
    searchStore.sort = sort as SearchSortType;
  } else if (query) {
    // Set sort type to relevance if the search query is present but the sort
    // type isn't.
    searchStore.sort = SearchSortType.Relevance;
  }

  // Flag for if at least one filter is enabled.
  let isFilterEnabled = false;

  forEachFilterParam(searchStore, ({ key, value, stateKey, filterKey }) => {
    if (params.getAll(key).includes(value)) {
      set(searchStore.filters, [filterKey, stateKey], true);

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
      searchStore.page = totalPages;
    } else {
      searchStore.page = page;
    }
  }

  // Do not update page state if the page query parameter is not set or if it's
  // already set to the beginning page.
  if (pageStr && page !== BEGINNING_PAGE) {
    // If the page number is not a number or less than the beginning page, then
    // set it to the beginning page.
    if (Number.isNaN(page) || page < BEGINNING_PAGE) {
      searchStore.page = BEGINNING_PAGE;
    } else if (
      // If a query or filter is provided, then the `totalPages` state can only be
      // calculated using the derived state of the `searchResultStore`.
      query ||
      isFilterEnabled
    ) {
      // Create a one-time subscriber so that we can read the `totalPages` state
      // when it's available. This helps prevent the URL from flashing while we
      // load the state.
      const unsubscribe = subscribe(resultsStore, () => {
        const { totalPages } = snapshot(resultsStore).results;
        setPageState(totalPages);
        unsubscribe();
      });
    } else {
      const totalPages = Math.ceil(
        searchStore.search.index.length / RESULTS_PER_PAGE,
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
function updateQueryParameters({
  initialLoad,
  searchStore,
}: {
  initialLoad?: boolean;
  searchStore: PluginSearchStore;
}) {
  const url = new URL(window.location.href);
  const params = searchStore.getSearchParams({ initialLoad });

  url.search = params.toString();
  if (window.location.href !== url.href) {
    replaceUrlState(url);
  }
}

/**
 * Initializes the search form state from query parameters and adds a state
 * subscriber to update the query parameters whenever the form state changes.
 *
 * @returns A function that can be used to unsubscribe the listener.
 */
export function startQueryParameterListener(
  searchStore: PluginSearchStore,
): () => void {
  updateQueryParameters({ searchStore, initialLoad: true });

  const unsubscribe = subscribe(searchStore, () =>
    updateQueryParameters({ searchStore }),
  );
  return unsubscribe;
}
