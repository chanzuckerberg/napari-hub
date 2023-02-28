/* eslint-disable max-classes-per-file */

import { over } from 'lodash';
import { NonFunctionKeys } from 'utility-types';
import { ref } from 'valtio';
import { subscribeKey } from 'valtio/utils';

import { BEGINNING_PAGE } from '@/constants/search';
import { PluginIndexData } from '@/types';

import { DEFAULT_SORT_TYPE } from './constants';
import { FuseSearchEngine } from './engines';
import { SearchFilterStore } from './filter.store';
import { SearchEngine, SearchResult } from './search.types';
import { Resettable } from './types';

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
