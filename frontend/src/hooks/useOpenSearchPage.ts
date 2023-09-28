import { useRouter } from 'next/router';
import { useCallback } from 'react';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';
import { useSearchStore } from '@/store/search/context';

/**
 * Returns a function for opening the search page with the URL and frontend
 * state initialized with the user query state.
 */
export function useOpenSearchPage() {
  const router = useRouter();
  const { searchStore } = useSearchStore();

  return useCallback(
    async (query: string) => {
      // Set query in global state so that the search bar shows the query while
      // the search page is loading.
      searchStore.search.query = query;

      const url = {
        pathname: '/plugins',
        query: {
          // Params will be encoded automatically by Next.js.
          [SearchQueryParams.Search]: query,
          [SearchQueryParams.Sort]: SearchSortType.Relevance,
        },
      };
      await router.push(url);
    },
    [router, searchStore.search],
  );
}
