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
 * Hook that gets the active query parameter from the URL. First it tries
 * getting the query parameter from the Next.js router. This will be populated
 * on initial server side rendering.
 *
 * If the query object is empty, check the URL for the query parameter. The
 * query object will only be empty for client side navigation:
 * https://github.com/vercel/next.js/issues/9473
 *
 * @returns Query parameter or empty string if undefined
 */
export function useActiveQueryParameter(): string {
  const router = useRouter();
  let query = router.query[SEARCH_QUERY_PARAM] as string | undefined;

  if (!query && process.browser) {
    const url = new URL(window.location.href);
    query = url.searchParams.get(SEARCH_QUERY_PARAM) ?? '';
  }

  return query ?? '';
}

/**
 * Hook that syncs the query string to the `query` URL parameter. If the query
 * is empty, then the URL parameter is removed.
 *
 * @param query The search query string.
 */
export function useQueryParameter(query: string): void {
  const router = useRouter();
  const activeQuery = useActiveQueryParameter();

  useEffect(() => {
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
  }, [activeQuery, query, router]);
}
