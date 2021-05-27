import type { FilterForm } from './filter.hooks';
import type { SearchForm } from './search.hooks';
import { SearchResult } from './search.types';
import type { SortForm } from './sort.hooks';

/**
 * Function that transforms a list of search results into a different list of
 * search results after sorting or filtering.
 */
export type SearchResultTransformFunction = (
  results: SearchResult[],
) => SearchResult[];

/**
 * Root search state.
 */
export interface SearchState {
  filter: FilterForm;
  search: SearchForm;
  results: SearchResult[];
  sort: SortForm;
}
