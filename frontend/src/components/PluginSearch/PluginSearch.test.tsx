import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { useRouter } from 'next/router';

import pluginIndex from '@/fixtures/index.json';
import { pluginIndexState } from '@/store/search/search.state';

import { PluginSearch } from './PluginSearch';

function mockSearch(query = '') {
  const component = render(
    <Provider initialValues={[[pluginIndexState, pluginIndex]]}>
      <PluginSearch />
    </Provider>,
  );

  if (query) {
    const input = component.getByTestId('searchBarInput') as HTMLInputElement;
    const form = component.getByTestId('searchBarForm');

    fireEvent.change(input, {
      target: {
        value: query,
      },
    });
    fireEvent.submit(form);
  }

  return { component };
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
    mockSearch('animate');

    const [summary] = screen.getAllByTestId('searchResultSummary');
    expect(summary.textContent).toContain('animation');
  });
});
