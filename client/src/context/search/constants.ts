/**
 * Route to search page.
 */
export const SEARCH_PAGE = '/';

/**
 * Sorting methods for search results.
 */
export enum SearchSortType {
  Relevance = 'relevance',
  ReleaseDate = 'releaseDate',
  FirstReleased = 'firstReleased',
  PluginName = 'pluginName',
}

/**
 * Query parameters used for storing search form data.
 */
export enum SearchQueryParams {
  Filter = 'filter',
  Search = 'search',
  Sort = 'sort',
}
