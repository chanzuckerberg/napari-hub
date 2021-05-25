import { isEmpty, pickBy, reduce, set } from 'lodash';
import { Dispatch, SetStateAction } from 'react';
import { DeepPartial } from 'utility-types';

import { FilterFormState } from './filter.types';

/**
 * Returns the default filter form state derived from the search results.
 *
 * @param results Search results
 * @returns The default state
 */
export function getDefaultState(): FilterFormState {
  return {
    developmentStatus: {
      onlyStablePlugins: false,
    },

    license: {
      onlyOpenSourcePlugins: false,
    },

    operatingSystems: {
      linux: false,
      mac: false,
      windows: false,
    },

    pythonVersions: {
      '3.7': false,
      '3.8': false,
      '3.9': false,
    },
  };
}

/**
 * Higher order function that returns a state setter for checkbox sub-states.
 *
 * @param setState The root state setter
 * @param key The sub-state to use
 * @returns A function to merge state into the sub-state
 */
export function getCheckboxSetter<S extends FilterFormState, K extends keyof S>(
  setState: Dispatch<SetStateAction<S>>,
  key: K,
) {
  return (nextState: Partial<S[K]>): void =>
    setState((prevState) => ({
      ...prevState,
      [key]: {
        ...prevState[key],
        ...nextState,
      },
    }));
}

/**
 * Returns a copy of the form state object with only truthy values present. If
 * there are no truthy values present, then return undefined. This is used for
 * setting the filter query parameter only when at least one filter is enabled.
 *
 * @param formState The form state
 * @returns A partial form state with only truthy values, otherwise undefined
 */
export function filterFalsyValues(
  formState: FilterFormState,
): DeepPartial<FilterFormState> | undefined {
  const enabledState = pickBy(
    reduce(
      formState,
      (result, state, key) => set(result, key, pickBy(state, Boolean)),
      {} as DeepPartial<FilterFormState>,
    ),
    (state) => !isEmpty(state),
  );

  if (isEmpty(enabledState)) {
    return undefined;
  }

  return enabledState;
}
