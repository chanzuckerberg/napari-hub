/* eslint-disable max-classes-per-file */

import { over } from 'lodash';
import { NonFunctionKeys } from 'utility-types';
import { ref } from 'valtio';
import { subscribeKey } from 'valtio/utils';

import { BEGINNING_PAGE } from '@/constants/search';
import { PluginIndexData } from '@/types';

import { DEFAULT_SORT_TYPE, SearchQueryParams } from './constants';
import { FuseSearchEngine } from './engines';
import { SearchFilterStore } from './filter.store';
import { SearchEngine, SearchResult } from './search.types';
import { Resettable } from './types';
import { forEachFilterParam, PARAM_KEY_MAP } from './utils';

export class SearchEngineStore implements Resettable {
  engine: SearchEngine;

  query = '';

  constructor(public index: PluginIndexData[] = []) {
    this.engine = ref(this.getDefaultSearchEngine());
    this.engine.index(index);
  }

  search(): SearchResult[] {
    return this.engine.search(this.query);
  }

  private getDefaultSearchEngine() {
    return new FuseSearchEngine();
  }

  reset() {
    this.query = '';
  }
}

export class PluginSearchStore implements Resettable {
  page = BEGINNING_PAGE;

  sort = DEFAULT_SORT_TYPE;

  constructor(
    public search = new SearchEngineStore(),
    public filters = new SearchFilterStore(),
  ) {}

  reset() {
    this.page = BEGINNING_PAGE;
    this.sort = DEFAULT_SORT_TYPE;
    this.search.reset();
    this.filters.reset();
  }

  /**
   * Sets up a state subscriber that resets the page whenever the search, sort
   * type, or filters change.
   */
  startPageResetListener(): () => void {
    const resetPage = () => {
      this.page = BEGINNING_PAGE;
    };

    const unsubscribe = over([
      subscribeKey(this, 'search', resetPage),
      subscribeKey(this, 'sort', resetPage),
      subscribeKey(this, 'filters', resetPage),
    ]);

    return unsubscribe;
  }

  getSearchParams({
    initialLoad,
  }: { initialLoad?: boolean } = {}): URLSearchParams {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    // Draft parameter object to store updated parameter values.
    const nextParams = new URLSearchParams();

    // Set of parameters that should not transfer to the draft parameter object.
    // This is necessary so that the URL maintains non state related parameters in
    // the URL.
    const blockedParams = new Set([
      ...Object.values(SearchQueryParams),
      ...Object.keys(this.filters).map((key) => PARAM_KEY_MAP[key] ?? key),
    ]);

    for (const key of params.keys()) {
      if (!blockedParams.has(key)) {
        for (const value of params.getAll(key)) {
          nextParams.append(key, value);
        }
      }
    }

    // Search query
    const { query } = this.search;
    if (query) {
      nextParams.set(SearchQueryParams.Search, query);
    }

    // Sort type
    // Don't set sort type on initial load unless a value is already specified.
    if (!initialLoad || params.get(SearchQueryParams.Sort)) {
      nextParams.set(SearchQueryParams.Sort, this.sort);
    }

    // Filters
    forEachFilterParam(this, ({ key, value, state }) => {
      if (typeof state === 'boolean' && state) {
        nextParams.append(key, value);
      }
    });

    // Current page.
    // Don't set query parameter on initial load unless a value is already specified.
    if (!initialLoad || params.get(SearchQueryParams.Page)) {
      nextParams.set(SearchQueryParams.Page, String(this.page));
    }

    return nextParams;
  }
}

export type FilterKey = NonFunctionKeys<PluginSearchStore['filters']>;
export type FilterType = 'category' | 'requirement';

export type FilterCategoryKeys = keyof Pick<
  PluginSearchStore['filters'],
  'imageModality' | 'workflowStep'
>;

export type FilterRequirementKeys = keyof Omit<
  PluginSearchStore['filters'],
  FilterCategoryKeys
>;
