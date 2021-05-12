import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { PluginIndexData } from '@/types';
import { Logger } from '@/utils/logger';
import { measureExecution } from '@/utils/performance';

import { FuseSearchEngine } from './engines';
import { SEARCH_PAGE, SEARCH_QUERY_PARAM } from './search.constants';
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
export function useSearchEngine(
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

/**
 * Hook that returns a new list of plugins when the search query updates.
 *
 * @param engine The search engine instance
 * @param query The query string
 * @param index The plugin index
 * @returns The filtered plugins
 */
export function useSearchResults(
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
      return index.map((plugin, pluginIndex) => ({
        plugin,
        index: pluginIndex,
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
  }, [engine, query, index]);

  return plugins;
}

/**
 * Hook that gets the active query parameter from the URL.
 *
 * @returns Query parameter or empty string if undefined
 */
export function useActiveQueryParameter(): string {
  const router = useRouter();
  const activeQuery = router.query[SEARCH_QUERY_PARAM] as string | undefined;
  return activeQuery ?? '';
}

/**
 * Hook that syncs the query string to the `query` URL parameter. If the query
 * is empty, then the URL parameter is removed.
 *
 * @param query The search query string.
 */
export function useQueryParameter(query: string): void {
  const router = useRouter();

  useEffect(() => {
    // Get the active query parameter from the URL. This is retrieved from
    // `window.location.href` because `useActiveQueryParameter()` returns an
    // empty string for some reason.
    const activeQuery =
      new URL(window.location.href).searchParams.get(SEARCH_QUERY_PARAM) ?? '';

    // Skip routing if queries are equal to prevent infinite rendering
    if (query === activeQuery) {
      return;
    }

    logger.debug('setting query parameter:', {
      activeQuery,
      query,
    });

    const queryParams: Record<string, string> = {};
    if (query) {
      queryParams[SEARCH_QUERY_PARAM] = query;
    }

    router
      // Use shallow rendering to prevent unnecessary data fetching:
      // https://nextjs.org/docs/routing/shallow-routing
      .replace(SEARCH_PAGE, { query: queryParams }, { shallow: true })
      .catch((err) =>
        logger.error('Unable to set search query parameter', err),
      );
  }, [query, router]);
}
