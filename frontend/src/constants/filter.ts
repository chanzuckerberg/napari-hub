import {
  filterLinuxState,
  filterMacState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
  filterWindowsState,
} from '@/store/search/filter.state';
import { StateLabelEntry } from '@/utils';

export const PYTHON_LABEL_ENTRIES: StateLabelEntry[] = [
  {
    label: '3.7',
    state: [filterPython37State],
  },
  {
    label: '3.8',
    state: [filterPython38State],
  },
  {
    label: '3.9',
    state: [filterPython39State],
  },
];

export const OPERATING_SYSTEM_LABEL_ENTRIES: StateLabelEntry[] = [
  {
    label: 'Linux',
    state: filterLinuxState,
  },
  {
    label: 'macOS',
    state: filterMacState,
  },
  {
    label: 'Windows',
    state: filterWindowsState,
  },
];
