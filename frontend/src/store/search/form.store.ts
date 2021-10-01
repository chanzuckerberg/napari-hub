import { over } from 'lodash';
import { proxy, ref } from 'valtio';
import { derive, subscribeKey } from 'valtio/utils';

import { BEGINNING_PAGE } from '@/constants/search';
import { PluginIndexData } from '@/types';

import { DEFAULT_SORT_TYPE } from './constants';
import { FuseSearchEngine } from './engines';
import { SearchEngine } from './search.types';
import { FilterChipItem, SpdxLicenseData } from './types';

/**
 * Default state used for initializing and resetting the store.
 */
export const DEFAULT_STATE = {
  page: BEGINNING_PAGE,

  search: {
    index: [] as PluginIndexData[],
    engine: null as SearchEngine | null,
    query: '',
  },

  sort: DEFAULT_SORT_TYPE,

  filters: {
    devStatus: {
      stable: false,
    },

    license: {
      openSource: false,
      osiApprovedLicenseSet: new Set<string>(),
    },

    operatingSystems: {
      linux: false,
      mac: false,
      windows: false,
    },

    pythonVersions: {
      3.7: false,
      3.8: false,
      3.9: false,
    },
  },
};

/**
 * Valtio store for UI form data on the search page. This includes the search
 * bar, sort radio group, and all of the filter items.
 */
export const searchFormStore = proxy(DEFAULT_STATE);

if (process.browser) {
  (window as any).searchFormStore = searchFormStore;
}

export type SearchFormStore = typeof searchFormStore;

/**
 * Derived store for filter chips. This returns a list of key-value pairs that
 * correspond to each enabled filter.
 */
export const filterChipsStore = derive({
  filterChips(get) {
    const filterState = get(searchFormStore).filters;
    const filterChipItems: FilterChipItem[] = [];

    for (const [filterType, filters] of Object.entries(filterState)) {
      for (const [filterKey, state] of Object.entries(filters)) {
        if (typeof state === 'boolean' && state) {
          filterChipItems.push({
            key: filterType,
            value: filterKey,
          });
        }
      }
    }

    return filterChipItems;
  },
});

function getDefaultSearchEngine() {
  return new FuseSearchEngine();
}

/**
 * Creates a new set that includes all of the OSI approved licenses using the
 * `isOsiApproved` property.
 *
 * https://git.io/JEEVd
 *
 * @param licenses The SPDX license data.
 * @returns The set of approved license IDs.
 */
function getOsiApprovedLicenseSet(licenses: SpdxLicenseData[]): Set<string> {
  return new Set(
    licenses
      .filter((license) => license.isOsiApproved)
      .map((license) => license.licenseId),
  );
}

export function initSearchEngine(index: PluginIndexData[]): void {
  const searchEngine = getDefaultSearchEngine();
  searchEngine.index(index);

  // Store as ref so that changes to the search engine don't cause a re-render.
  searchFormStore.search.engine = ref(searchEngine);
  searchFormStore.search.index = index;
}

export function initOsiApprovedLicenseSet(licenses: SpdxLicenseData[]): void {
  searchFormStore.filters.license.osiApprovedLicenseSet = getOsiApprovedLicenseSet(
    licenses,
  );
}

export function resetFilters(): void {
  for (const store of Object.values(searchFormStore.filters)) {
    for (const [filterKey, value] of Object.entries(store)) {
      // Reset all boolean states
      if (typeof value === 'boolean') {
        (store as Record<string, boolean>)[filterKey] = false;
      }
    }
  }
}

export function resetState(): void {
  searchFormStore.page = BEGINNING_PAGE;
  searchFormStore.search.query = DEFAULT_STATE.search.query;
  searchFormStore.sort = DEFAULT_STATE.sort;
  resetFilters();
}

/**
 * Sets up a state subscriber that resets the page whenever the search, sort
 * type, or filters change.
 */
export function initPageResetListener(): () => void {
  function resetPage() {
    searchFormStore.page = BEGINNING_PAGE;
  }

  const unsubscribe = over([
    subscribeKey(searchFormStore, 'search', resetPage),
    subscribeKey(searchFormStore, 'sort', resetPage),
    subscribeKey(searchFormStore, 'filters', resetPage),
  ]);

  return unsubscribe;
}
