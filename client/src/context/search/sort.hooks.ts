import { createEnumParam, useQueryParam, withDefault } from 'use-query-params';

import { useActiveURLParameter } from '@/hooks';

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
  const initialSortType = useActiveURLParameter<SearchSortType>(
    SearchQueryParams.Sort,
  );
  const [sortType, setSortType] = useQueryParam(
    SearchQueryParams.Sort,
    withDefault(
      createEnumParam(SortTypeValues),
      // Default to release date if sort type is not initial in URL
      initialSortType ?? DEFAULT_SORT_TYPE,
    ),
  );

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

/**
 * Hook that provides access to the sort form state and handles sorting plugins
 * based on the selected sort type.
 *
 * @param results The search results
 * @returns Sorted results and form data
 */
export function useSort(results: SearchResult[]) {
  const sortForm = useForm();
  const sortedResults = sortResults(sortForm.sortType, results);

  return {
    sortForm,
    sortedResults,
  };
}
