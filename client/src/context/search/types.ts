import { SearchResult } from './search.types';

/**
 * Function that transforms a list of search results into a different list of
 * search results after sorting or filtering.
 */
export type SearchResultTransformFunction = (
  results: SearchResult[],
) => SearchResult[];
