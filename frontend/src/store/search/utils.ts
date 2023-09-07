import _ from 'lodash';

import type { PluginSearchStore } from './search.store';

export const PARAM_KEY_MAP: Record<string, string | undefined> = {
  operatingSystems: 'operatingSystem',
  pythonVersion: 'python',
};

export const PARAM_VALUE_MAP: Record<string, string | undefined> = {
  openSource: 'oss',
};

interface ForEachFilterParamCallbackOptions {
  filterKey: string;
  key: string;
  state: unknown;
  stateKey: string;
  value: string;
}
/**
 * Utility function for iterating through all filter states with relevant data.
 * This includes the state keys, parameter names / values, and the state value.
 *
 * @param callback The callback to call :)
 */
export function forEachFilterParam(
  searchStore: PluginSearchStore,
  callback: (options: ForEachFilterParamCallbackOptions) => void,
) {
  for (const [filterKey, store] of Object.entries(searchStore.filters)) {
    if (_.isObject(store)) {
      for (const [stateKey, state] of Object.entries(store)) {
        const key = PARAM_KEY_MAP[filterKey] ?? filterKey;
        const value = PARAM_VALUE_MAP[stateKey] ?? stateKey;
        callback({
          state: state as boolean,
          filterKey,
          key,
          stateKey,
          value,
        });
      }
    }
  }
}
