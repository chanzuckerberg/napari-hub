/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { renderHook } from '@testing-library/react-hooks';
import { NextRouter, useRouter } from 'next/router';
import React from 'react';
import { act } from 'react-dom/test-utils';

import pluginIndex from '@/fixtures/index.json';
import { setSkeletonResultCount } from '@/utils';

import {
  DEFAULT_SORT_TYPE,
  SearchQueryParams,
  SearchSortType,
  SKELETON_RESULT_COUNT_BUFFER,
} from './constants';
import {
  useSearch,
  useSearchEffects,
  UseSearchEffectsOptions,
} from './search.hooks';
import { SearchEngine, SearchResult } from './search.types';

jest.useFakeTimers();

jest.mock('@/utils/search', () => ({
  getSearchScrollY: jest.fn(),
  scrollToSearchBar: jest.fn(),
  setSkeletonResultCount: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('use-query-params', () => ({
  useQueryParam: jest.fn().mockImplementation((_, initial: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { useState }: { useState: typeof React.useState } = require('react');
    return useState(initial);
  }),
  withDefault: jest.fn(),
}));

function mockRouter() {
  type Replace = NextRouter['replace'];
  const replace = jest
    .fn<ReturnType<Replace>, Parameters<Replace>>()
    .mockReturnValue(Promise.resolve(true));

  (useRouter as jest.Mock).mockReturnValue({
    replace,
    query: {},
  });

  return { replace };
}

type Search = SearchEngine['search'];
const search = jest
  .fn<ReturnType<Search>, Parameters<Search>>()
  .mockReturnValue([]);

beforeEach(() => {
  search.mockClear();
});

describe('useSearch()', () => {
  const mockPlugin: SearchResult = {
    index: 6,
    plugin: pluginIndex[6],
    matches: {},
  };
  const pluginIndexList = pluginIndex.map((plugin, index) => ({
    matches: {},
    index,
    plugin,
  }));

  beforeEach(() => {
    mockRouter();
    search.mockReturnValueOnce([mockPlugin]);
  });

  it('should initially return index as search result list', () => {
    const { result } = renderHook(() => useSearch(pluginIndex).results);
    expect(result.current).toEqual(pluginIndexList);
  });

  it('should return index list when clearing query', () => {
    const { result } = renderHook(() => useSearch(pluginIndex));
    act(() => result.current.searchForm.setQuery('nothing'));
    expect(result.current.results).toHaveLength(0);

    act(() => result.current.searchForm.clearQuery());
    expect(result.current.results).toEqual(pluginIndexList);
  });

  it('should return match in search result list', () => {
    const { result } = renderHook(() => useSearch(pluginIndex));
    act(() => result.current.searchForm.setQuery('video'));
    expect(result.current.results[0]).toMatchObject(mockPlugin);
  });
});

describe('useSearchEffects()', () => {
  const oldLocation = window.location;

  beforeEach(() => {
    window.location = oldLocation;
  });

  function mockSortType(
    options: UseSearchEffectsOptions,
    sortType: SearchSortType,
  ) {
    const url = new URL('http://localhost');
    url.searchParams.set(SearchQueryParams.Sort, sortType);

    window.location = { href: url.toString() } as Location;
    // eslint-disable-next-line no-param-reassign
    options.sortForm.sortType = sortType;
  }

  function getOptions(
    options: Partial<UseSearchEffectsOptions> = {},
  ): UseSearchEffectsOptions {
    return {
      query: '',
      results: [],
      sortForm: {
        setSortType: jest.fn(),
        sortType: SearchSortType.Relevance,
      },

      ...options,
    };
  }

  it('should set sort type to relevance on intial load', () => {
    const options = getOptions({ query: 'video' });
    renderHook(() => useSearchEffects(options));
    expect(options.sortForm.setSortType).toHaveBeenCalled();
  });

  it('should not set sort type to relevance when user has sort type on initial load', () => {
    const options = getOptions({ query: 'video' });
    mockSortType(options, SearchSortType.PluginName);
    renderHook(() => useSearchEffects(options));
    expect(options.sortForm.setSortType).not.toHaveBeenCalled();
  });

  it('should set sort type to relevance when user enters query', () => {
    const options = getOptions();
    const { sortForm } = options;
    const { rerender } = renderHook(() => useSearchEffects(options));
    expect(sortForm.setSortType).not.toHaveBeenCalled();

    options.query = 'video';
    rerender();
    expect(sortForm.setSortType).toHaveBeenCalledWith(SearchSortType.Relevance);
  });

  it('should set sort type to default when user clears query and sort type is relevance', () => {
    const options = getOptions({ query: 'video' });
    const { rerender } = renderHook(() => useSearchEffects(options));

    options.query = '';
    rerender();
    expect(options.sortForm.setSortType).toHaveBeenCalledWith(
      DEFAULT_SORT_TYPE,
    );
  });

  it('should maintain sort type when user clears query and sort type is not relevance', () => {
    const options = getOptions({ query: 'video' });
    mockSortType(options, SearchSortType.PluginName);
    const { rerender } = renderHook(() => useSearchEffects(options));

    options.query = '';
    rerender();
    expect(options.sortForm.setSortType).not.toHaveBeenCalled();
  });

  it('should set skeleton result count when rendered', () => {
    const results = pluginIndex.slice(0, 3).map((plugin, index) => ({
      index,
      plugin,
      matches: {},
    }));

    const options = getOptions({ results });
    renderHook(() => useSearchEffects(options));

    const expected = results.length + SKELETON_RESULT_COUNT_BUFFER;
    expect(setSkeletonResultCount).toHaveBeenCalledWith(expected);
  });
});
