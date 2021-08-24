import { atom } from 'jotai';

import { Logger } from '@/utils/logger';
import { measureExecution } from '@/utils/performance';

import { filterResults } from './filters';
import {
  pluginIndexState,
  searchEngineState,
  searchQueryState,
} from './search.state';
import { SearchResult } from './search.types';
import { sortTypeState } from './sort.state';
import { sortResults } from './sorters';

const logger = new Logger('results.state.ts');

/**
 * Search result list state after executing query using the client search engine.
 */
const searchResultsState = atom<SearchResult[]>((get) => {
  const query = get(searchQueryState);
  const engine = get(searchEngineState);

  if (!engine || !query) {
    return get(pluginIndexState).map<SearchResult>((plugin, pluginIndex) => ({
      plugin,
      index: pluginIndex,
      matches: {},
    }));
  }

  const { duration, result: results } = measureExecution(() =>
    engine.search(query),
  );

  logger.debug('plugin search:', {
    query,
    results,
    duration,
  });

  return results;
});

/**
 * Search result list state after filtering results.
 */
const filteredResultsState = atom<SearchResult[]>((get) =>
  filterResults(get, get(searchResultsState)),
);

/**
 * Search result list state after sorting and filtering results.
 */
const sortedResultsState = atom<SearchResult[]>((get) =>
  sortResults(get(sortTypeState), get(filteredResultsState)),
);

/**
 * Export filtered and sorted results as primary search result state.
 */
export { sortedResultsState as searchResultsState };
