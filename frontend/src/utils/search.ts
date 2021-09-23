import { SEARCH_BAR_ID } from '@/constants/search';

/**
 * Key used for storing vertical scroll value on the search page. See `_app.tsx`
 * and `AppBarLinks.tsx` for implementation details.
 */
const SEARCH_SCROLL_Y_KEY = 'search-scroll-y';

// Variables to store `localStorage` values in memory so that reads will only
// query `localStorage` at once.
let searchScrollY: number | undefined;

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
