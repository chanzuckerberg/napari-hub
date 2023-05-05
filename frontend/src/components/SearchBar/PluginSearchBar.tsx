import { useRouter } from 'next/router';
import { HTMLProps, InputHTMLAttributes } from 'react';
import { useSnapshot } from 'valtio';

import { BEGINNING_PAGE } from '@/constants/search';
import { resetLoadingState } from '@/store/loading';
import {
  DEFAULT_SORT_TYPE,
  SEARCH_PAGE,
  SearchQueryParams,
  SearchSortType,
} from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';
import { isSearchPage, scrollToSearchBar } from '@/utils';

import { SearchBar } from './SearchBar';

interface Props extends HTMLProps<HTMLFormElement> {
  /**
   * Render large variant of search bar with a larger font size and search icon.
   */
  large?: boolean;

  /**
   * Additional props to pass to the input element.
   */
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

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
export function PluginSearchBar({ large, inputProps, ...props }: Props) {
  const router = useRouter();
  const { searchStore } = useSearchStore();
  const state = useSnapshot(searchStore);
  const { query } = state.search;

  /**
   * Performs a search query on form submission. If the user is on the search
   * page, this runs the query through the search engine. Otherwise, it
   * redirects to the search page with the query added to the URL.
   */
  async function submitForm(searchQuery: string) {
    // Reset loading state when navigating to the search page.
    resetLoadingState();

    if (isSearchPage(window.location.pathname)) {
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
      // Set query in global state so that the search bar shows the query while
      // the search page is loading.
      searchStore.search.query = searchQuery;

      const url = {
        pathname: SEARCH_PAGE,
        query: {
          // Params will be encoded automatically by Next.js.
          [SearchQueryParams.Search]: searchQuery,
          [SearchQueryParams.Sort]: SearchSortType.Relevance,
        },
      };
      await router.push(url);
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
    />
  );
}
