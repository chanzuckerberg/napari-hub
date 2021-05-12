import { createContext, useContext, useState } from 'react';
import { ReactNode } from 'react-markdown';

import { PluginIndexData } from '@/types';

import {
  useActiveQueryParameter,
  useQueryParameter,
  useSearchEngine,
  useSearchResults,
} from './search.hooks';
import { SearchResult } from './search.types';

/**
 * Shared state for search data.
 */
interface SearchState {
  query: string;
  results: SearchResult[];
  setQuery(query: string): void;
}

const PluginStateContext = createContext<SearchState | null>(null);

interface Props {
  children: ReactNode;
  pluginIndex: PluginIndexData[];
}

/**
 * Provider for search state.  This allows child components to access the update
 * or access the search query and render search results.
 */
export function PluginSearchProvider({ children, pluginIndex }: Props) {
  // Set initial query state from active query parameter.
  const activeQuery = useActiveQueryParameter();
  const [query, setQuery] = useState(activeQuery);

  // Update query parameter as user types query.
  useQueryParameter(query);

  // Use search engine to find plugins using the query.
  const engine = useSearchEngine(pluginIndex);
  const results = useSearchResults(engine, query, pluginIndex);

  return (
    <PluginStateContext.Provider
      value={{
        query,
        results,
        setQuery,
      }}
    >
      {children}
    </PluginStateContext.Provider>
  );
}

/**
 * Hook for accessing the search state context.
 */
export function useSearchState(): SearchState | null {
  return useContext(PluginStateContext);
}
