import { createContext, useContext } from 'react';
import { ReactNode } from 'react-markdown';

import { PluginIndexData } from '@/types';

import { useFilters } from './filter.hooks';
import { useSearch, useSearchEffects } from './search.hooks';
import { useSort } from './sort.hooks';
import { SearchState } from './types';

interface Props {
  children: ReactNode;
  pluginIndex: PluginIndexData[];
}

const PluginSearchStateContext = createContext<SearchState | null>(null);

/**
 * Hook for accessing the search state context.
 */
export function useSearchState(): SearchState | null {
  return useContext(PluginSearchStateContext);
}

/**
 * Provider for search state.  This allows child components to get/set the query
 * and get search results.
 */
export function PluginSearchProvider({ children, pluginIndex }: Props) {
  const { searchForm, results } = useSearch(pluginIndex);
  const { filterForm, filteredResults } = useFilters(results);
  const { sortForm, sortedResults } = useSort(filteredResults);

  useSearchEffects({
    sortForm,
    query: searchForm.query,
    results: sortedResults,
  });

  return (
    <PluginSearchStateContext.Provider
      value={{
        filter: filterForm,
        results: sortedResults,
        search: searchForm,
        sort: sortForm,
      }}
    >
      {children}
    </PluginSearchStateContext.Provider>
  );
}
