/**
 * Route to search page.
 */
export const SEARCH_PAGE = '/';

/**
 * Sorting methods for search results.
 */
export enum SearchSortType {
  FirstReleased = 'newest',
  PluginName = 'pluginName',
  ReleaseDate = 'recentlyUpdated',
  Relevance = 'relevance',
  TotalInstalls = 'totalInstalls',
}

export const DEFAULT_SORT_TYPE = SearchSortType.ReleaseDate;

/**
 * Query parameters used for storing search form data.
 */
export enum SearchQueryParams {
  Search = 'search',
  Sort = 'sort',
  Page = 'page',
}
