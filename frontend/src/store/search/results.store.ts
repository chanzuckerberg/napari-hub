import { derive } from 'valtio/utils';

import { Logger, measureExecution, setSkeletonResultCount } from '@/utils';

import { filterResults } from './filters';
import { searchFormStore } from './form.store';
import { SearchResult } from './search.types';
import { sortResults } from './sorters';

const logger = new Logger('results.store.ts');

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

    // Store result count in sessionStorage for the skeleton loader.
    if (process.browser) {
      setSkeletonResultCount(results.length);
    }

    return results;
  },
});
