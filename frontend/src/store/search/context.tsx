import { over } from 'lodash';
import { useRouter } from 'next/router';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { proxy } from 'valtio';

import { useLoadingState } from '@/context/loading';
import { PluginIndexData } from '@/types';

import { SearchFilterStore } from './filter.store';
import {
  initStateFromQueryParameters,
  startQueryParameterListener,
} from './queryParameters';
import { getResultsStore, PluginSearchResultStore } from './results.store';
import { PluginSearchStore, SearchEngineStore } from './search.store';
import { SpdxLicenseData } from './types';
import { usePlausibleSearchEvents } from './usePlausibleSearchEvents';

interface SearchStoreContextValue {
  /**
   * Store for accessing and setting form data related to plugin search.
   */
  searchStore: PluginSearchStore;

  /**
   * Store for accessing plugin search results based on the form data.
   */
  resultsStore: PluginSearchResultStore;
}

const SearchStoreContext = createContext<SearchStoreContextValue | null>(null);

interface Props extends Partial<SearchStoreContextValue> {
  children: ReactNode;
  /**
   * List of plugins used to index the search engine.
   */
  index?: PluginIndexData[];

  /**
   * SPDX licenses used to initialize the license filters.
   */
  licenses?: SpdxLicenseData[];

  /**
   * Skip state initialization. This will force the provider to use only the
   * default state and skip search effects.
   */
  skipInit?: boolean;
}

/**
 * Provider for providing global loading state to a component tree.
 */
export function SearchStoreProvider({
  children,
  searchStore: searchStoreProp,
  index = [],
  licenses = [],
  skipInit = false,
}: Props) {
  const router = useRouter();
  const isLoading = useLoadingState();
  const stateInitRef = useRef(false);
  const shouldInitState = !skipInit && !isLoading;

  // Place stores in refs so that there's only one store created at a time per render.
  const searchStore = useRef(
    proxy(
      searchStoreProp ??
        new PluginSearchStore(
          new SearchEngineStore(index),
          new SearchFilterStore({}, index, licenses),
        ),
    ),
  ).current;
  const resultsStore = useRef(
    getResultsStore(searchStore, router.asPath),
  ).current;

  // Initialize state once on initial render. This needs to happen outside of an
  // effect so that it runs before any nested effects.
  if (shouldInitState && !stateInitRef.current) {
    stateInitRef.current = true;
    initStateFromQueryParameters(searchStore, resultsStore, router.asPath);
  }

  // Effect for setting up search effects that run on initial load.
  useEffect(() => {
    if (!shouldInitState) {
      return () => {};
    }

    // Create single function that calls a list of functions. In this case, a
    // subscriber that unsubscribes from everything.
    const unsubscribe = over([
      searchStore.startPageResetListener(),
      startQueryParameterListener(searchStore),
    ]);

    return unsubscribe as () => void;
  }, [searchStore, shouldInitState]);

  usePlausibleSearchEvents(searchStore);

  const context = useMemo(
    () => ({
      resultsStore,
      searchStore,
    }),
    [resultsStore, searchStore],
  );

  return (
    <SearchStoreContext.Provider value={context}>
      {children}
    </SearchStoreContext.Provider>
  );
}

export function useSearchStore(): SearchStoreContextValue {
  const value = useContext(SearchStoreContext);

  if (!value) {
    throw new Error('State should be defined!');
  }

  return value;
}
