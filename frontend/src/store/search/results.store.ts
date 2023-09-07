import { derive } from 'valtio/utils';

import { RESULTS_PER_PAGE } from '@/constants/search';
import { Logger, measureExecution } from '@/utils';

import { SearchQueryParams } from './constants';
import type { PluginSearchStore } from './search.store';
import { SearchResult } from './search.types';
import { sortResults } from './sorters';

const logger = new Logger('results.store.ts');

export interface PluginSearchResultStore {
  results: {
    paginatedResults: SearchResult[];
    totalPages: number;
    totalPlugins: number;
  };
}

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

export function getResultsStore(
  searchStore: PluginSearchStore,
): PluginSearchResultStore {
  return derive({
    results: (get) => {
      const state = get(searchStore);
      const { query, index } = state.search;

      let results: SearchResult[];
      let searchDuration = '0 ms';

      // Return full list of plugins if the engine or query aren't defined.
      if (!query) {
        results = index
          .filter((plugin) => !!plugin.name)
          .map<SearchResult>((plugin, pluginIndex) => ({
            plugin,
            index: pluginIndex,
            matches: {},
          }));
      } else {
        const { duration, result } = measureExecution(() =>
          searchStore.search.search(),
        );

        results = result;
        searchDuration = duration;
      }

      results = state.filters.filterResults(results);
      results = sortResults(state.sort, results);

      const totalPlugins = results.length;
      const totalPages = Math.ceil(totalPlugins / RESULTS_PER_PAGE);

      const params = state.getSearchParams();
      params.delete(SearchQueryParams.Search);
      const enabledState: Record<string, string[]> = {};

      for (const key of params.keys()) {
        enabledState[key] = params.getAll(key);
      }

      logger.debug({
        message: 'plugin search',
        // only show existence of query since we don't want to log query in case
        // of user accidentally pasting PII.
        hasQuery: !!query,
        enabledState,
        searchDuration,
        totalPages,
        totalPlugins,
      });

      return {
        totalPlugins,
        totalPages,
        paginatedResults: getPaginationResults(results, state.page),
      };
    },
  });
}
