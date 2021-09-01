/**
 * Route to search page.
 */
export const SEARCH_PAGE = '/';

/**
 * Sorting methods for search results.
 */
export enum SearchSortType {
  Relevance = 'relevance',
  ReleaseDate = 'recentlyUpdated',
  FirstReleased = 'newest',
  PluginName = 'pluginName',
}

export const DEFAULT_SORT_TYPE = SearchSortType.ReleaseDate;

/**
 * Query parameters used for storing search form data.
 */
export enum SearchQueryParams {
  Search = 'search',
  Sort = 'sort',
}

/**
 * Small buffer for skeleton results because the heights for the skeleton
 * results are not the same as the actual results.
 */
export const SKELETON_RESULT_COUNT_BUFFER = 5;
