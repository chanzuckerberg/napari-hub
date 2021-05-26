import { defaultsDeep } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';
import { DeepPartial } from 'utility-types';

import { useActiveURLParameter } from '@/hooks';

import { SearchQueryParams } from './constants';
import { FilterFormState } from './filter.types';
import {
  filterFalsyValues,
  getCheckboxSetter,
  getDefaultState,
} from './filter.utils';
import { filterResults } from './filters';
import { SearchResult } from './search.types';

/**
 * Hook that gets the initial form state. It first checks if there's state in
 * the filter query param and parses it. It then deep merges the initial state
 * with the form default state.
 *
 * @param results Search results
 * @returns The initial form state
 */
function useInitialFormState() {
  const initialFilterParam =
    useActiveURLParameter(SearchQueryParams.Filter) ?? '';

  const initialFormState = useMemo(() => {
    try {
      return JSON.parse(initialFilterParam) as DeepPartial<FilterFormState>;
    } catch (_) {
      return {};
    }
  }, [initialFilterParam]);

  return defaultsDeep(initialFormState, getDefaultState()) as FilterFormState;
}

/**
 * Hook that returns up the filter form state and state setters.
 *
 * @param results Search results to populate initial state with
 * @returns The filter form state
 */
function useForm() {
  const initialState = useInitialFormState();

  // We don't need the first parameter because we're storing the form state in a
  // separate `useState()` below.
  const [, setFilterParam] = useQueryParam<
    DeepPartial<FilterFormState> | undefined
  >(SearchQueryParams.Filter, withDefault(JsonParam, initialState));

  const [state, setState] = useState<FilterFormState>(initialState);

  /**
   * Resets the filter form state to its default state.
   */
  function clearAll() {
    setState(getDefaultState());
  }

  // Update the filter query parameter with the filtered state
  useEffect(() => setFilterParam(filterFalsyValues(state)), [
    setFilterParam,
    state,
  ]);

  return {
    clearAll,
    setDevelopmentStatus: getCheckboxSetter(setState, 'developmentStatus'),
    setLicense: getCheckboxSetter(setState, 'license'),
    setOperatingSystem: getCheckboxSetter(setState, 'operatingSystems'),
    setPythonVersion: getCheckboxSetter(setState, 'pythonVersions'),
    state,
  };
}

/**
 * Return type of `useForm()` hook. This includes the form data and data
 * setters.
 */
export type FilterForm = ReturnType<typeof useForm>;

/**
 * Hook that provides access to the filter form state and handles filtering
 * plugins based on enabled filters.
 *
 * @param results The search results
 * @returns Filtered results and form data
 */
export function useFilters(results: SearchResult[]) {
  const filterForm = useForm();
  const filteredResults = filterResults(results, filterForm.state);

  return {
    filteredResults,
    filterForm,
  };
}
