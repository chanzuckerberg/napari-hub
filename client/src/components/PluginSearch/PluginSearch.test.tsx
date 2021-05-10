import { render, screen } from '@testing-library/react';
import { NextRouter, useRouter } from 'next/router';

import { PluginSearchProvider } from '@/context/search/search';
import pluginIndex from '@/fixtures/index.json';

import { PluginSearch } from './PluginSearch';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

function mockSearch(query = '') {
  type Replace = NextRouter['replace'];
  const replace = jest
    .fn<ReturnType<Replace>, Parameters<Replace>>()
    .mockReturnValue(Promise.resolve(true));

  (useRouter as jest.Mock).mockReturnValue({
    pathname: '/',
    query: { query },
    replace,
  });

  const component = render(
    <PluginSearchProvider pluginIndex={pluginIndex}>
      <PluginSearch />
    </PluginSearchProvider>,
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
    expect(title.querySelector('a')?.innerHTML).toContain(query);
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

  it('should show result with match in author email', () => {
    const query = 'gmail.com';
    mockSearch(query);

    const [author] = screen.getAllByTestId('searchResultAuthor');
    expect(author.innerHTML.toLowerCase()).toContain(query);
  });

  it('should support fuzzy matching', () => {
    mockSearch('neuron');

    const [author] = screen.getAllByTestId('searchResultSummary');
    expect(author.innerHTML.toLowerCase()).toContain('neuroanatomy');
  });
});
