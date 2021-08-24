import {
  OPERATING_SYSTEM_LABEL_ENTRIES,
  PYTHON_LABEL_ENTRIES,
} from '@/constants/filter';
import {
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterOnlyStablePluginsState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
  filterWindowsState,
} from '@/store/search/filter.state';
import { getStateLabelEntries } from '@/utils';

/**
 * Map that contains the names for query parameters given a list of states.
 */
export const FILTER_NAME_LABELS = getStateLabelEntries(
  {
    label: 'python',
    state: [filterPython37State, filterPython38State, filterPython39State],
  },
  {
    label: 'operatingSystem',
    state: [filterLinuxState, filterMacState, filterWindowsState],
  },
  {
    label: 'status',
    state: [filterOnlyStablePluginsState],
  },
  {
    label: 'license',
    state: [filterOnlyOpenSourcePluginsState],
  },
);

/**
 * Map that contains the values to use when a particular state is enabled.
 */
export const FILTER_VALUE_LABELS = getStateLabelEntries(
  // Python version labels.
  ...PYTHON_LABEL_ENTRIES,

  // Operating system labels.
  ...OPERATING_SYSTEM_LABEL_ENTRIES.map((entry) => ({
    ...entry,
    label: entry.label.toLowerCase(),
  })),

  // Development status labels.
  { label: 'stable', state: filterOnlyStablePluginsState },

  // License labels.
  { label: 'oss', state: filterOnlyOpenSourcePluginsState },
);
