import { atom } from 'jotai';
import { RESET } from 'jotai/utils';

import { atomWithQueryParameter } from '@/utils/state';

// Development status filter state.
export const filterOnlyStablePluginsState = atomWithQueryParameter(false, {
  paramName: 'devStatus',
  paramValue: 'stable',
});

// License filter state.
export const filterOnlyOpenSourcePluginsState = atomWithQueryParameter(false, {
  paramName: 'license',
  paramValue: 'oss',
});

// Operating system filter state
export const filterLinuxState = atomWithQueryParameter(false, {
  paramName: 'operatingSystem',
  paramValue: 'linux',
});
export const filterMacState = atomWithQueryParameter(false, {
  paramName: 'operatingSystem',
  paramValue: 'macos',
});
export const filterWindowsState = atomWithQueryParameter(false, {
  paramName: 'operatingSystem',
  paramValue: 'windows',
});

// Python version filter state
export const filterPython37State = atomWithQueryParameter(false, {
  paramName: 'python',
  paramValue: '3.7',
});
export const filterPython38State = atomWithQueryParameter(false, {
  paramName: 'python',
  paramValue: '3.8',
});
export const filterPython39State = atomWithQueryParameter(false, {
  paramName: 'python',
  paramValue: '3.9',
});

export const FILTER_STATES = [
  filterOnlyStablePluginsState,
  filterOnlyOpenSourcePluginsState,
  filterLinuxState,
  filterMacState,
  filterWindowsState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
];

export type FilterStateType = typeof FILTER_STATES[number];

/**
 * Derived filter chip state used to render the filter chips. This state is a
 * list of the enabled filter states. When resetting this state, every dependent
 * filter state will be reset as well.
 */
export const filterChipState = atom(
  (get) => FILTER_STATES.filter((state) => get(state)),
  (_, set, value: unknown | typeof RESET) => {
    // Reset all filter states if the chip state is reset.
    if (value === RESET) {
      FILTER_STATES.forEach((state) => set(state, value));
    }
  },
);
