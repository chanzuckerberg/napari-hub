import dayjs from 'dayjs';

import { FilterStateType } from '@/store/search/filter.state';

/**
 * Utility to transform a date into a more readable format.  Useful for ISO and
 * UTC date strings that need to be more readable.
 *
 * @param dateString A date string parseable by Date
 * @returns The formatted date string
 */
export function formatDate(dateString: string): string {
  return dayjs(dateString).format('DD MMMM YYYY');
}

/**
 * Utility for formatting a pypi operating systems string. This removes the
 * nested classifiers so that only the OS name is rendered.
 *
 * @param operatingSystem List of operating systems classifiers.
 * @returns The operating system formatted as a comma list.
 */
export function formatOperatingSystem(operatingSystem: string): string {
  // Return last part of OS trove classifier. The nesting on pypi is
  // arbitrary, so you can have a long string like "Operating Systems ::
  // Microsoft :: Windows :: Windows 10", or a short string like "Operating
  // Systems :: OS Independent".
  const parts = operatingSystem.split(' :: ');
  const name = parts[parts.length - 1];

  return name.replace('OS Independent', 'All');
}

/**
 * A configuration object that specifies a label for one or many states.
 */
export interface StateLabelEntry {
  state: FilterStateType | FilterStateType[];
  label: string;
}

/**
 * Creates a map that can be used for creating labels based on some atom sate
 * config. This is useful when some state requires a label for rendering.
 *
 * @param entries Array of state label entries to create a new map from.
 * @returns The state label map.
 */
export function getStateLabelEntries(
  ...entries: StateLabelEntry[]
): Map<FilterStateType, string> {
  const result = new Map<FilterStateType, string>();

  for (const { state, label } of entries) {
    if (state instanceof Array) {
      for (const subState of state) {
        result.set(subState, label);
      }
    } else {
      result.set(state, label);
    }
  }

  return result;
}
