/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { renderHook } from '@testing-library/react-hooks';
import { NextRouter, useRouter } from 'next/router';
import React from 'react';
import { act } from 'react-dom/test-utils';

import pluginIndex from '@/fixtures/index.json';

import {
  DEFAULT_SORT_TYPE,
  SearchQueryParams,
  SearchSortType,
} from './constants';
import { useSearch, useSearchEffects } from './search.hooks';
import { SearchEngine, SearchResult } from './search.types';
import type { SortForm } from './sort.hooks';

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
  let form: SortForm;
  const oldLocation = window.location;

  beforeEach(() => {
    form = {
      setSortType: jest.fn(),
      sortType: SearchSortType.Relevance,
    };

    window.location = oldLocation;
  });

  function mockSortType(sortType: SearchSortType) {
    const url = new URL('http://localhost');
    url.searchParams.set(SearchQueryParams.Sort, sortType);

    window.location = { href: url.toString() } as Location;
    form.sortType = sortType;
  }

  it('should set sort type to relevance on intial load', () => {
    renderHook(() => useSearchEffects('video', form));
    expect(form.setSortType).toHaveBeenCalled();
  });

  it('should not set sort type to relevance when user has sort type on initial load', () => {
    mockSortType(SearchSortType.PluginName);
    renderHook(() => useSearchEffects('video', form));
    expect(form.setSortType).not.toHaveBeenCalled();
  });

  it('should set sort type to relevance when user enters query', () => {
    let query = '';
    const { rerender } = renderHook(() => useSearchEffects(query, form));
    expect(form.setSortType).not.toHaveBeenCalled();

    query = 'video';
    rerender();
    expect(form.setSortType).toHaveBeenCalledWith(SearchSortType.Relevance);
  });

  it('should set sort type to default when user clears query and sort type is relevance', () => {
    let query = 'video';
    const { rerender } = renderHook(() => useSearchEffects(query, form));

    query = '';
    rerender();
    expect(form.setSortType).toHaveBeenCalledWith(DEFAULT_SORT_TYPE);
  });

  it('should maintain sort type when user clears query and sort type is not relevance', () => {
    mockSortType(SearchSortType.PluginName);
    let query = 'video';
    const { rerender } = renderHook(() => useSearchEffects(query, form));

    query = '';
    rerender();
    expect(form.setSortType).not.toHaveBeenCalled();
  });
});
