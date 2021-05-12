import { act, renderHook } from '@testing-library/react-hooks';
import { NextRouter, useRouter } from 'next/router';

import pluginIndex from '@/fixtures/index.json';
import { PluginIndexData } from '@/types';

import {
  SEARCH_PAGE,
  useQueryParameter,
  useSearchEngine,
  useSearchResults,
} from './search.hooks';
import { SearchEngine, SearchResult } from './search.types';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

function mockRouter() {
  type Replace = NextRouter['replace'];
  const replace = jest
    .fn<ReturnType<Replace>, Parameters<Replace>>()
    .mockReturnValue(Promise.resolve(true));

  (useRouter as jest.Mock).mockReturnValueOnce({
    replace,
  });

  return { replace };
}

type Search = SearchEngine['search'];
const search = jest
  .fn<ReturnType<Search>, Parameters<Search>>()
  .mockReturnValue([]);

const engine: SearchEngine = {
  search,
  index: jest.fn(),
};

beforeEach(() => {
  search.mockClear();
});

describe('useSearchEngine', () => {
  const getSearchEngine = jest.fn(() => engine);

  afterEach(() => {
    getSearchEngine.mockClear();
  });

  it('should create search engine on initial render', () => {
    renderHook(() => useSearchEngine(pluginIndex, getSearchEngine));
    expect(getSearchEngine).toHaveBeenCalledTimes(1);
  });

  it('should re-create search engine if index changes', () => {
    const { rerender } = renderHook((index = pluginIndex) =>
      useSearchEngine(index as PluginIndexData[], getSearchEngine),
    );
    rerender(pluginIndex.slice(0, 1));
    expect(getSearchEngine).toHaveBeenCalledTimes(2);
  });
});

describe('useSearchResults()', () => {
  it('should return index as search result list when search engine is not ready', () => {
    const { result } = renderHook(() =>
      useSearchResults(null, 'query', pluginIndex),
    );

    const expected = pluginIndex.map((plugin, index) => ({
      index,
      plugin,
    }));

    expect(result.current).toEqual(expected);
  });

  it('should return index as search result list for empty query', () => {
    const { result } = renderHook(() =>
      useSearchResults(engine, '', pluginIndex),
    );

    const expected = pluginIndex.map((plugin, index) => ({
      index,
      plugin,
    }));

    expect(result.current).toEqual(expected);
  });

  it('should return match in search result list', () => {
    const plugin: SearchResult = {
      index: 0,
      plugin: pluginIndex[0],
    };
    search.mockReturnValueOnce([plugin]);

    const { result } = renderHook(() =>
      useSearchResults(engine, 'compressed', pluginIndex),
    );
    expect(result.current[0]).toEqual(plugin);
  });
});

describe('useQueryParameter()', () => {
  it('should set parameter for a query', () => {
    const { replace } = mockRouter();
    const query = 'query';
    renderHook(() => useQueryParameter(query));

    const [args] = replace.mock.calls;
    expect(args[1]).toEqual({ query: { query } });
  });

  it('should not set parameter if already set on URL', () => {
    const query = 'query';
    window.location.href = `http://localhost/?query=${query}`;

    const { replace } = mockRouter();
    renderHook(() => useQueryParameter(query));

    expect(replace).not.toHaveBeenCalled();
  });
});
