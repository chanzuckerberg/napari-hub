import { derive } from 'valtio/utils';

import { RESULTS_PER_PAGE } from '@/constants/search';
import { Logger, measureExecution } from '@/utils';

import { filterResults } from './filters';
import { searchFormStore } from './form.store';
import { SearchResult } from './search.types';
import { sortResults } from './sorters';

const logger = new Logger('results.store.ts');

/**
 * Helper for getting a paginated slice of the results.
 *
 * @param results The search results.
 * @param page The current page.
 * @returns The paginated results.
 */
function getPaginationResults(results: SearchResult[], page: number) {
  const startIndex = (page - 1) * RESULTS_PER_PAGE;
  const endIndex = Math.min(results.length, page * RESULTS_PER_PAGE);
  return results.slice(startIndex, endIndex);
}

/**
 * Valtio derived store for plugin search results. This store is used for
 * executing the search engine query, and then filtering and sorting the
 * results.
 */
export const searchResultsStore = derive({
  results(get) {
    const state = get(searchFormStore);
    const { query, engine, index } = state.search;

    let results: SearchResult[];

    // Return full list of plugins if the engine or query aren't defined.
    if (!engine || !query) {
      results = index.map<SearchResult>((plugin, pluginIndex) => ({
        plugin,
        index: pluginIndex,
        matches: {},
      }));
    } else {
      const { duration, result } = measureExecution(() => engine.search(query));

      logger.debug('plugin search:', {
        query,
        result,
        duration,
      });

      results = result;
    }

    results = filterResults(get, results);
    results = sortResults(state.sort, results);

    const totalPlugins = results.length;
    const totalPages = Math.ceil(totalPlugins / RESULTS_PER_PAGE);

    return {
      totalPlugins,
      totalPages,
      paginatedResults: getPaginationResults(results, state.page),
    };
  },
});
