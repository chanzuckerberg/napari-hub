import clsx from 'clsx';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { useRouter } from 'next/router';
import { HTMLProps, useEffect, useState } from 'react';

import { Close, Search } from '@/components/common/icons';
import {
  DEFAULT_SORT_TYPE,
  SEARCH_PAGE,
  SearchQueryParams,
  SearchSortType,
} from '@/store/search/constants';
import {
  searchEnabledState,
  searchQueryState,
} from '@/store/search/search.state';
import { sortTypeState } from '@/store/search/sort.state';
import { scrollToSearchBar, setSearchScrollY } from '@/utils';

import styles from './SearchBar.module.scss';

interface Props extends HTMLProps<HTMLFormElement> {
  /**
   * Render large variant of search bar with a larger font size and search icon.
   */
  large?: boolean;
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
export function SearchBar({ large, ...props }: Props) {
  const router = useRouter();
  const [isSearchEnabled] = useAtom(searchEnabledState);
  const [query, setQuery] = useAtom(searchQueryState);
  const [sortType, setSortType] = useAtom(sortTypeState);
  const resetQuery = useResetAtom(searchQueryState);

  // Local state for query. This is used to store the current entered query string.
  const [localQuery, setLocalQuery] = useState(query ?? '');

  // Ensure that local query is sync'd whenever the query changes. This is
  // mostly useful for initial load when the `search` URL parameter populates
  // the search query state.
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const iconClassName = clsx(
    'h-5 w-5',

    // 22x22 pixels when root font-size is 16px
    large && 'h-[1.375rem] w-[1.375rem]',
  );

  /**
   * Performs a search query on form submission. If the user is on the search
   * page, this runs the query through the search engine. Otherwise, it
   * redirects to the search page with the query added to the URL.
   */
  async function submitForm(searchQuery: string) {
    // Reset `scrollY` value so that the browser can scroll to the search
    // bar after searching.
    setSearchScrollY(0);

    if (isSearchEnabled) {
      if (searchQuery) {
        setQuery(searchQuery);
        scrollToSearchBar({ behavior: 'smooth' });
        setSortType(SearchSortType.Relevance);
      } else {
        resetQuery();

        if (sortType === SearchSortType.Relevance) {
          setSortType(DEFAULT_SORT_TYPE);
        }
      }
    } else {
      const url = {
        pathname: SEARCH_PAGE,
        query: {
          // Params will be encoded automatically by Next.js.
          [SearchQueryParams.Search]: searchQuery,
        },
      };
      await router.push(url);
    }
  }

  return (
    <form
      data-testid="searchBarForm"
      className={clsx(
        // Flex layout
        'flex flex-auto items-center',

        // Borders
        'border-b-2 border-black',

        large && 'text-xl',
      )}
      onSubmit={async (event) => {
        event.preventDefault();
        await submitForm(localQuery);
      }}
      {...props}
    >
      <input
        aria-label="Search bar for searching for napari plugins."
        data-testid="searchBarInput"
        className={clsx(
          // Flex layout
          'flex flex-auto',

          // Remove border and focus outline around input
          'border-none outline-none',

          // Remove white colored input background
          'bg-transparent',

          /*
            Inputs have a default width defined by the browser, so we have to
            set this explicitly to make the input flexible:
            https://stackoverflow.com/a/42421490
          */
          'w-0',
        )}
        onChange={(event) => {
          const { value } = event.target;
          setLocalQuery(value);
        }}
        value={localQuery}
      />

      <button
        aria-label={query ? 'Clear search bar text' : 'Submit search query'}
        data-testid={query ? 'clearQueryButton' : 'submitQueryButton'}
        onClick={async () => {
          // Clear local query if close button is clicked and the search engine
          // is currently rendering the results for another query.
          let searchQuery = localQuery;

          if (query) {
            setLocalQuery('');
            searchQuery = '';
          }

          await submitForm(searchQuery);
        }}
        // We use `type="button"` because `type="submit"` will first call the
        // `onClick()` handler and then the `onSubmit()` handler, regardless of
        // whether the user clicked on the button or not.
        type="button"
      >
        {/* Render close button if the user submitted a query. */}
        {query ? (
          <Close className={clsx(iconClassName, styles.closeIcon)} />
        ) : (
          <Search className={iconClassName} />
        )}
      </button>
    </form>
  );
}
