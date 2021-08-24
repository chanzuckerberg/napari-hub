import { atom } from 'jotai';

import { PluginIndexData } from '@/types';
import { atomWithQueryParameter } from '@/utils/state';

import { SearchQueryParams } from './constants';
import { SearchEngine } from './search.types';

/**
 * State for the hub plugin index used for the search engine.
 */
export const pluginIndexState = atom<PluginIndexData[]>([]);

/**
 * State for global search bar query. This state is used to derive other states
 * the search engine results state.
 */
export const searchQueryState = atomWithQueryParameter('', {
  paramName: SearchQueryParams.Search,
});

/**
 * State for holding the instance of the search engine.
 */
export const searchEngineState = atom<SearchEngine | null>(null);

/**
 * Derived state for determining if search is currently enabled. This is
 * determined by checking if the search engine has been instantiated yet.
 */
export const searchEnabledState = atom<boolean>(
  (get) => !!get(searchEngineState),
);
