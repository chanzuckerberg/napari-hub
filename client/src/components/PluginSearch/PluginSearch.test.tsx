import { render, screen } from '@testing-library/react';
import { set } from 'lodash';
import { NextRouter, useRouter } from 'next/router';

import {
  PluginSearchProvider,
  SearchQueryParams,
  SearchSortType,
} from '@/context/search';
import { URLParameterStateProvider } from '@/context/urlParameters';
import pluginIndex from '@/fixtures/index.json';

import { PluginSearch } from './PluginSearch';

function mockSearch(query = '') {
  type Replace = NextRouter['replace'];
  const replace = jest
    .fn<ReturnType<Replace>, Parameters<Replace>>()
    .mockReturnValue(Promise.resolve(true));

  const params = [
    [SearchQueryParams.Search, query],
    [SearchQueryParams.Sort, SearchSortType.Relevance],
  ];

  (useRouter as jest.Mock).mockReturnValue({
    asPath: `/?${new URLSearchParams(params).toString()}`,
    pathname: '/',
    query: params.reduce(
      (result, [key, value]) => set(result, key, value),
      {} as Record<string, string>,
    ),
    push: jest.fn(),
    replace,
  });

  const component = render(
    <URLParameterStateProvider>
      <PluginSearchProvider pluginIndex={pluginIndex}>
        <PluginSearch />
      </PluginSearchProvider>
    </URLParameterStateProvider>,
  );

  return { component, replace };
}

describe('<PluginSearch />', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockClear();
  });

  it('should match snapshot', () => {
    const { component } = mockSearch();
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should show result with match in name', () => {
    const query = 'segment';
    mockSearch(query);

    const [title] = screen.getAllByTestId('searchResultName');
    expect(title.innerHTML).toContain(query);
  });

  it('should show result with match in summary', () => {
    const query = 'bio';
    mockSearch(query);

    const [summary] = screen.getAllByTestId('searchResultSummary');
    expect(summary.innerHTML).toContain(query);
  });

  it('should show result with match in author name', () => {
    const query = 'ziyang';
    mockSearch(query);

    const [author] = screen.getAllByTestId('searchResultAuthor');
    expect(author.innerHTML.toLowerCase()).toContain(query);
  });

  it('should support fuzzy matching', () => {
    mockSearch('neuron');

    const [author] = screen.getAllByTestId('searchResultSummary');
    expect(author.innerHTML.toLowerCase()).toContain('neuro');
  });
});
