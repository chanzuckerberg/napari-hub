import { defaultsDeep } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';
import { DeepPartial } from 'utility-types';

import { useActiveURLParameter, usePlausible } from '@/hooks';

import { SearchQueryParams } from './constants';
import { FilterFormState } from './filter.types';
import {
  filterFalsyValues,
  getChipState,
  getDefaultState,
} from './filter.utils';
import { useFilterResults } from './filters';
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

function usePlausibleEvents() {
  const plausible = usePlausible();

  function sendPlausibleEvent(field: string, value: string, checked: boolean) {
    plausible('Filter', {
      checked,
      field,
      value,
    });
  }

  return sendPlausibleEvent;
}

/**
 * Hook that returns up the filter form state and state setters.
 *
 * @param results Search results to populate initial state with
 * @returns The filter form state
 */
function useForm() {
  const sendPlausibleEvent = usePlausibleEvents();
  const initialState = useInitialFormState();

  // We don't need the first parameter because we're storing the form state in a
  // separate `useState()` below.
  const [, setFilterParam] = useQueryParam<
    DeepPartial<FilterFormState> | undefined
  >(SearchQueryParams.Filter, withDefault(JsonParam, initialState));

  const [state, setState] = useState<FilterFormState>(initialState);
  const chips = getChipState(state);

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

  /**
   * Removes a chip from the chips state.
   *
   * @param key The key of root filter state
   * @param subKey The sub key of the filter state
   */
  function removeChip(key: string, subKey: string) {
    setState((prevState) => ({
      ...prevState,

      [key]: {
        ...prevState[key as keyof FilterFormState],
        [subKey]: false,
      },
    }));

    sendPlausibleEvent(key, subKey, false);
  }

  /**
   * Higher order function that returns a state setter for checkbox sub-states.
   *
   * @param key The sub-state to use
   * @returns A function to merge state into the sub-state
   */
  function getCheckboxSetter<
    K extends keyof FilterFormState,
    S extends FilterFormState[K]
  >(key: K) {
    return (nextState: Partial<S>): void => {
      setState((prevState) => ({
        ...prevState,
        [key]: {
          ...prevState[key],
          ...nextState,
        },
      }));

      Object.entries(nextState).forEach(([subKey, checked]) =>
        sendPlausibleEvent(key, subKey, checked as boolean),
      );
    };
  }

  return {
    // State
    chips,
    state,

    // State update functions
    clearAll,
    removeChip,
    setDevelopmentStatus: getCheckboxSetter('developmentStatus'),
    setLicense: getCheckboxSetter('license'),
    setOperatingSystem: getCheckboxSetter('operatingSystems'),
    setPythonVersion: getCheckboxSetter('pythonVersions'),
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
  const filteredResults = useFilterResults(results, filterForm.state);

  return {
    filteredResults,
    filterForm,
  };
}
