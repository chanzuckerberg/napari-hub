import { derive } from 'valtio/utils';

import { Logger, measureExecution } from '@/utils';

import { filterResults } from './filters';
import { searchFormStore } from './form.store';
import { SearchResult } from './search.types';
import { sortResults } from './sorters';

const logger = new Logger('results.store.ts');

export const searchResultsStore = derive({
  results(get) {
    const state = get(searchFormStore);
    const { query, engine, index } = state.search;

    let results: SearchResult[];

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
    return sortResults(state.sort, results);
  },
});
