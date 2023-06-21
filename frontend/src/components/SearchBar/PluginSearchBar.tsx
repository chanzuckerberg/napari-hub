import { useSnapshot } from 'valtio';

import { BEGINNING_PAGE } from '@/constants/search';
import { useOpenSearchPage } from '@/hooks/useOpenSearchPage';
import { resetLoadingState } from '@/store/loading';
import { DEFAULT_SORT_TYPE, SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';
import { isHomePage, scrollToSearchBar } from '@/utils';

import { Props as SearchBarProps, SearchBar } from './SearchBar';

type Props = Omit<SearchBarProps, 'value' | 'onChange' | 'onSubmit'>;

/**
 * Search bar component. This renders an input field with a underline and
 * magnifying glass icon to the right of the component. When the user enters a query,
 * one of two things can happen:
 *
 * 1. User is on search page, so submitting a query re-renders the plugin list.
 *
 * 2. User is not on search page, so submitting a query redirects to the search
 * page with the `search=` URL parameter set.
 *
 * This makes the SearchBar component re-useable for non-search enabled pages.
 */
export function PluginSearchBar(props: Props) {
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const { query } = state.search;
  const openSearchPage = useOpenSearchPage();

  /**
   * Performs a search query on form submission. If the user is on the search
   * page, this runs the query through the search engine. Otherwise, it
   * redirects to the search page with the query added to the URL.
   */
  async function submitForm(searchQuery: string) {
    // Reset loading state when navigating to the search page.
    resetLoadingState();

    if (isHomePage(window.location.pathname)) {
      if (searchQuery) {
        scrollToSearchBar({ behavior: 'smooth' });
        searchStore.search.query = searchQuery;
        searchStore.sort = SearchSortType.Relevance;
      } else {
        searchStore.search.query = '';

        if (state.sort === SearchSortType.Relevance) {
          searchStore.sort = DEFAULT_SORT_TYPE;
        }
      }
    } else if (searchQuery) {
      await openSearchPage(searchQuery);
    }

    // Reset pagination when searching with a new query.
    searchStore.page = BEGINNING_PAGE;
  }

  return (
    <SearchBar
      changeOnSubmit
      value={query}
      onChange={(value) => {
        searchStore.search.query = value;
      }}
      onSubmit={(value) => submitForm(value)}
      {...props}
    />
  );
}
