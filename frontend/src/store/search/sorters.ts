import { SearchSortType } from './constants';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

/**
 * Compare two dates to sort from newest to oldest.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
 *
 * @param dateA The first date
 * @param dateB The second date
 * @returns <0 if dateA is newer than dateB, >0 if dateB is newer than dateA, and 0 if equal.
 */
export function compareDates(dateA: string, dateB: string): number {
  // time in ms makes newer dates have higher values
  return new Date(dateB).getTime() - new Date(dateA).getTime();
}

function sortByReleaseDate(results: SearchResult[]) {
  return (
    results
      // Create a copy of the array
      .slice()
      .sort((a, b) =>
        compareDates(a.plugin.release_date, b.plugin.release_date),
      )
  );
}

function sortByFirstReleased(results: SearchResult[]) {
  return (
    results
      // Create a copy of the array
      .slice()
      .sort((a, b) =>
        compareDates(a.plugin.first_released, b.plugin.first_released),
      )
  );
}

function sortByPluginName(results: SearchResult[]) {
  return (
    results
      // Create a copy of the array
      .slice()
      .sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))
  );
}

/**
 * Map of sort types to sort functions. Used for calling a particular sort
 * function given the sort type. Each function should return a new copy of the
 * array to prevent unintended side-effects.
 */
const SORTERS: Record<SearchSortType, SearchResultTransformFunction | null> = {
  // Search engine already returns results in order of relevance.
  [SearchSortType.Relevance]: null,
  [SearchSortType.PluginName]: sortByPluginName,
  [SearchSortType.ReleaseDate]: sortByReleaseDate,
  [SearchSortType.FirstReleased]: sortByFirstReleased,
};

/**
 * Sorts the search results given the sort type.
 *
 * @param sortType The sort type
 * @param results The search results
 * @returns The sorted results
 */
export function sortResults(
  sortType: SearchSortType,
  results: SearchResult[],
): SearchResult[] {
  const sorter = SORTERS[sortType];
  return sorter?.(results) ?? results;
}
