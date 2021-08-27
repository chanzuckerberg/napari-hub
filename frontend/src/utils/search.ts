import { debounce } from 'lodash';

import { SEARCH_BAR_ID } from '@/constants/search';

/**
 * Key used for storing vertical scroll value on the search page. See `_app.tsx`
 * and `AppBarLinks.tsx` for implementation details.
 */
const SEARCH_SCROLL_Y_KEY = 'search-scroll-y';

/**
 * Key used for storing the number of skeleton results to render on the plugin
 * search page when it's loading.
 */
const SEARCH_SKELETON_COUNT_KEY = 'search-skeleton-count';
const SEARCH_DEFAULT_SKELETON_COUNT = 8;

// Variables to store `localStorage` values in memory so that reads will only
// query `localStorage` at once.
let searchScrollY: number | undefined;
let searchSkeletonResultCount: number | undefined;

/**
 * Retrieves the last used `scrollY` value from when the user last visited the
 * search page.
 *
 * @returns The `scrollY` value or 0 if undefined.
 */
export function getSearchScrollY(): number {
  if (!searchScrollY) {
    searchScrollY = parseInt(
      window.sessionStorage.getItem(SEARCH_SCROLL_Y_KEY) ?? '0',
      10,
    );
  }

  return searchScrollY;
}

/**
 * Stores the current `scrollY` value used on the search page. This is used for
 * going back to the last scroll location in case the user goes back from
 * another page. This uses `sessionStorage` so that the value is only persistent
 * for the current tab.
 *
 * @param scrollY The current `scrollY` value
 */
export function setSearchScrollY(scrollY: number): void {
  searchScrollY = scrollY;
  window.sessionStorage.setItem(SEARCH_SCROLL_Y_KEY, String(scrollY));
}

/**
 * Gets the number of results the search page should render while loading.
 *
 * @returns The result count.
 */
export function getSkeletonResultCount(): number {
  if (!searchSkeletonResultCount) {
    const value = window.sessionStorage.getItem(SEARCH_SKELETON_COUNT_KEY);
    searchSkeletonResultCount = value ? +value : SEARCH_DEFAULT_SKELETON_COUNT;
  }

  return searchSkeletonResultCount;
}

/**
 * Stores the current search result count to use for the skeleton count the next
 * time the user loads the search page.
 *
 * @param count The result count.
 */
function setSkeletonResultCountBase(count: number): void {
  searchSkeletonResultCount = count;
  window.sessionStorage.setItem(SEARCH_SKELETON_COUNT_KEY, String(count));
}

/**
 * Debounced export for `setSkeletonResultCount()` since this function may be
 * called multiple times a second due to state re-renders.
 */
export const setSkeletonResultCount = debounce(setSkeletonResultCountBase, 300);

function getSearchBar() {
  return document.getElementById(SEARCH_BAR_ID);
}

/**
 * Gets the distance between the top of the viewport and the search bar on the
 * search page.
 *
 * @returns The distance.
 */
export function getSearchBarDistanceFromTop(): number {
  const searchBar = getSearchBar();
  return searchBar?.offsetTop ?? 0;
}

/**
 * Scroll to the search bar on the search page. Smooth scrolling can be enabled
 * using the `options.behavior` parameter in case smooth scrolling is better for
 * UX for a particular feature.
 *
 * @param options Scrolling behavior options.
 */
export function scrollToSearchBar(options: ScrollOptions = {}): void {
  const searchBar = getSearchBar();
  searchBar?.scrollIntoView?.({
    ...options,
    inline: 'nearest',
    block: 'start',
  });
}
