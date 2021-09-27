import { SEARCH_BAR_ID } from '@/constants/search';

function getSearchBar() {
  return document.getElementById(SEARCH_BAR_ID);
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
