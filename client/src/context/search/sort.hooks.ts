import { useEffect, useRef } from 'react';
import { useEffectOnce, usePrevious } from 'react-use';
import { createEnumParam, useQueryParam, withDefault } from 'use-query-params';

import { useActiveURLParameter, usePlausible } from '@/hooks';

import {
  DEFAULT_SORT_TYPE,
  SearchQueryParams,
  SearchSortType,
} from './constants';
import { SearchResult } from './search.types';
import { sortResults } from './sorters';

const SortTypeValues = Object.values(SearchSortType);

/**
 * Hook that provides the form state for the sort by form.
 */
function useForm() {
  const searchParam = useActiveURLParameter<string>(SearchQueryParams.Search);
  const sortTypeParam = useActiveURLParameter<SearchSortType>(
    SearchQueryParams.Sort,
  );

  const [sortType, setSortType] = useQueryParam(
    SearchQueryParams.Sort,
    withDefault(createEnumParam(SortTypeValues), DEFAULT_SORT_TYPE),
  );

  // On initial load, set the sort type to:
  // 1. The sort type defined in the query parameter.
  // 2. Relevance if the sort parameter isn't in the URL, but the search parameter is.
  useEffectOnce(() => {
    const initialSortType =
      sortTypeParam ?? searchParam ? SearchSortType.Relevance : undefined;

    if (initialSortType) {
      setSortType(initialSortType);
    }
  });

  return {
    sortType,
    setSortType,
  };
}

/**
 * Return type of `useForm()` hook. This includes the form data and data
 * setters.
 */
export type SortForm = ReturnType<typeof useForm>;

function usePlausibleEvents(sortType: SearchSortType) {
  const plausible = usePlausible();
  const prevSortType = usePrevious(sortType);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Don't log sort event on initial load.
    if (initialLoadRef.current && sortType !== prevSortType) {
      plausible('Sort', {
        by: sortType,
      });
    } else if (!initialLoadRef.current) {
      initialLoadRef.current = true;
    }
  }, [plausible, prevSortType, sortType]);
}

/**
 * Hook that provides access to the sort form state and handles sorting plugins
 * based on the selected sort type.
 *
 * @param results The search results
 * @returns Sorted results and form data
 */
export function useSort(results: SearchResult[]) {
  const sortForm = useForm();
  usePlausibleEvents(sortForm.sortType);
  const sortedResults = sortResults(sortForm.sortType, results);

  return {
    sortForm,
    sortedResults,
  };
}
