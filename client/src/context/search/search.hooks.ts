import { useEffect, useMemo, useState } from 'react';
import { usePrevious } from 'react-use';
import { StringParam, useQueryParam, withDefault } from 'use-query-params';

import { useActiveURLParameter, usePlausible } from '@/hooks';
import { PluginIndexData } from '@/types';
import { Logger } from '@/utils/logger';
import { measureExecution } from '@/utils/performance';

import { SearchQueryParams } from './constants';
import { FuseSearchEngine } from './engines';
import { SearchEngine, SearchResult } from './search.types';

const logger = new Logger('search.hooks.ts');

function getDefaultSearchEngine() {
  return new FuseSearchEngine();
}

/**
 * Hook that creates the search engine instance for a given plugin index.
 *
 * @param index The list of plugins for indexing
 * @param getSearchEngine Function for creating a search engine.
 * @returns The search engine instance
 */
function useSearchEngine(
  index: PluginIndexData[],
  getSearchEngine: () => SearchEngine = getDefaultSearchEngine,
): SearchEngine | null {
  const [engine, setEngine] = useState<SearchEngine | null>(null);

  // Create new search engine whenever the index changes.
  useEffect(() => {
    const searchEngine = getSearchEngine();

    const { duration } = measureExecution(() => searchEngine.index(index));
    logger.debug('search index duration:', duration);

    setEngine(searchEngine);
  }, [index, getSearchEngine]);

  return engine;
}

function usePlausibleEvents(query?: string) {
  const plausible = usePlausible();
  const prevQuery = usePrevious(query);

  useEffect(() => {
    if (query && query !== prevQuery) {
      plausible('Search');
    }
  }, [plausible, prevQuery, query]);
}

/**
 * Hook that returns a new list of plugins when the search query updates.
 *
 * @param engine The search engine instance
 * @param query The query string
 * @param index The plugin index
 * @returns The filtered plugins
 */
function useSearchResults(
  engine: SearchEngine | null,
  query: string,
  index: PluginIndexData[],
): SearchResult[] {
  // Use `useMemo()` to only compute search results when the query changes.
  // Without it, React will execute the search query multiple times even if the
  // query hasn't changed.
  const plugins = useMemo(() => {
    // If the search engine hasn't been created yet or if the query is empty,
    // then return the full list of plugins.
    if (!engine || !query) {
      return index.map<SearchResult>((plugin, pluginIndex) => ({
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
  }, [engine, index, query]);

  usePlausibleEvents(query);

  return plugins;
}

function useForm() {
  const initialQuery = useActiveURLParameter(SearchQueryParams.Search);
  const [query, setQuery] = useQueryParam(
    SearchQueryParams.Search,
    withDefault(StringParam, undefined),
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  function clearQuery() {
    setQuery(undefined);
  }

  return {
    clearQuery,
    query,
    setQuery,
  };
}

export type SearchForm = ReturnType<typeof useForm>;

/**
 * Hook that sets up the browser search engine and searches for results using
 * the query string.
 *
 * @param index The plugin index
 * @returns Search query, results, and query updater
 */
export function useSearch(index: PluginIndexData[]) {
  const searchForm = useForm();

  // Use search engine to find plugins using the query.
  const engine = useSearchEngine(index);
  const results = useSearchResults(engine, searchForm.query ?? '', index);

  return { results, searchForm };
}
