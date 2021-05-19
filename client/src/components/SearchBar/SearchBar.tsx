import clsx from 'clsx';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { Search } from '@/components/common/icons';
import {
  SEARCH_PAGE,
  SEARCH_QUERY_PARAM,
  useSearchState,
} from '@/context/search';

interface Props {
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
 * 1. User is on search page, so typing a query re-renders the plugin list.
 *
 * 2. User is not on search page, so submitting a query redirects to the search
 * page with the `search=` URL parameter set.
 *
 * This makes the SearchBar component re-useable for non-search enabled pages.
 */
export function SearchBar({ large }: Props) {
  const router = useRouter();
  const { results, query, setQuery } = useSearchState() ?? {};

  // Local state for query. This is only used if the context state above isn't available.
  const [localQuery, setLocalQuery] = useState('');

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

        // Search state is only available on search enabled pages.
        const isSearchPage = results !== undefined;

        // If searching from another page, redirect to the search page with the
        // search query parameter to initiate a search on load.
        if (!isSearchPage) {
          const url = new URL(SEARCH_PAGE, window.location.origin);
          url.searchParams.set(
            SEARCH_QUERY_PARAM,
            encodeURIComponent(localQuery),
          );

          await router.push(url);
        }
      }}
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

          if (setQuery) {
            setQuery(value);
          } else {
            setLocalQuery(value);
          }
        }}
        value={query ?? localQuery}
      />

      <Search
        className={clsx(
          'w-5 h-5',

          // 22x22 pixels when root font-size is 16px
          large && 'h-[1.375rem] w-[1.375rem]',
        )}
      />
    </form>
  );
}
