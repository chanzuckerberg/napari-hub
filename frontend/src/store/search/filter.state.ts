import { atom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';

// Development status filter state.
export const filterOnlyStablePluginsState = atomWithReset(false);

// License filter state.
export const filterOnlyOpenSourcePluginsState = atomWithReset(false);

// Operating system filter state
export const filterLinuxState = atomWithReset(false);
export const filterMacState = atomWithReset(false);
export const filterWindowsState = atomWithReset(false);

// Python version filter state
export const filterPython37State = atomWithReset(false);
export const filterPython38State = atomWithReset(false);
export const filterPython39State = atomWithReset(false);

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
