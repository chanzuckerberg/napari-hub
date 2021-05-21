import { SearchSortType } from './constants';
import { SearchResult } from './search.types';
import { SearchResultTransformFunction } from './types';

function compareDates(dateA: string, dateB: string) {
  return new Date(dateA).getTime() - new Date(dateB).getTime();
}

function sortByReleaseDate(results: SearchResult[]) {
  return results
    .slice()
    .sort((a, b) => compareDates(a.plugin.release_date, b.plugin.release_date));
}

function sortByFirstReleased(results: SearchResult[]) {
  return results
    .slice()
    .sort((a, b) =>
      compareDates(a.plugin.first_released, b.plugin.first_released),
    );
}

function sortByPluginName(results: SearchResult[]) {
  return results
    .slice()
    .sort((a, b) => a.plugin.name.localeCompare(b.plugin.name));
}

const SORTERS: Record<SearchSortType, SearchResultTransformFunction | null> = {
  // Search engine already returns results in order of relevance.
  [SearchSortType.Relevance]: null,
  [SearchSortType.PluginName]: sortByPluginName,
  [SearchSortType.ReleaseDate]: sortByReleaseDate,
  [SearchSortType.FirstReleased]: sortByFirstReleased,
};

export function sortResults(
  sortType: SearchSortType,
  results: SearchResult[],
): SearchResult[] {
  const sorter = SORTERS[sortType];
  return sorter?.(results) ?? results;
}
