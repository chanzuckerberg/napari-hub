import { proxy, ref } from 'valtio';
import { derive } from 'valtio/utils';

import { PluginIndexData } from '@/types';

import { DEFAULT_SORT_TYPE } from './constants';
import { FuseSearchEngine } from './engines';
import { SearchEngine } from './search.types';
import { FilterChipItem, SpdxLicenseData } from './types';

export const DEFAULT_STATE = {
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

export const searchFormStore = proxy(DEFAULT_STATE);

export type SearchFormStore = typeof searchFormStore;

export const filterChipsStore = derive({
  filterChips(get) {
    const filterState = get(searchFormStore).filters;
    const filterChipItems: FilterChipItem[] = [];

    for (const [filterType, filters] of Object.entries(filterState)) {
      for (const [filterKey, value] of Object.entries(filters)) {
        if (typeof value === 'boolean' && value) {
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
  searchFormStore.search.query = DEFAULT_STATE.search.query;
  searchFormStore.sort = DEFAULT_STATE.sort;
  resetFilters();
}
