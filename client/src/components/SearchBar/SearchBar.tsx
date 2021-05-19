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
 * Creates a new URL with the search query added. It also adds the plugin search
 * ID so that the browser scrolls the search bar to the top.
 *
 * @param query The query string.
 * @returns The URL object.
 */
function getURLWithSearchParam(query: string): URL {
  const url = new URL(SEARCH_PAGE, window.location.origin);
  url.searchParams.set(SEARCH_QUERY_PARAM, encodeURIComponent(query));

  return url;
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
export function SearchBar({ large }: Props) {
  const router = useRouter();
  const { results, setQuery } = useSearchState() ?? {};

  // Local state for query. This is used to store the current entered query string.
  const [localQuery, setLocalQuery] = useState('');

  /**
   * Performs a search query on form submission. If the user is on the search
   * page, this runs the query through the search engine. Otherwise, it
   * redirects to the search page with the query added to the URL.
   */
  async function submitForm() {
    // Search state is only available on search enabled pages.
    const isSearchPage = results !== undefined;

    if (isSearchPage) {
      setQuery?.(localQuery);
    } else {
      const url = getURLWithSearchParam(localQuery);
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
        await submitForm();
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
          setLocalQuery(value);
        }}
        value={localQuery}
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
