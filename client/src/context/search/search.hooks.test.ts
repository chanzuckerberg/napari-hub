/* eslint-disable global-require, @typescript-eslint/no-var-requires */
import { renderHook } from '@testing-library/react-hooks';
import { NextRouter, useRouter } from 'next/router';
import React from 'react';
import { act } from 'react-dom/test-utils';

import pluginIndex from '@/fixtures/index.json';

import { useSearch } from './search.hooks';
import { SearchEngine, SearchResult } from './search.types';

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

describe('useSearchSetSortType()', () => {});
