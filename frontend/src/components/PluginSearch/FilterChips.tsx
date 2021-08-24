import { Button, Chip } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { isEmpty } from 'lodash';

import {
  OPERATING_SYSTEM_LABEL_ENTRIES,
  PYTHON_LABEL_ENTRIES,
} from '@/constants/filter';
import {
  filterChipState,
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterOnlyStablePluginsState,
  filterPython37State,
  filterPython38State,
  filterPython39State,
  FilterStateType,
  filterWindowsState,
} from '@/store/search/filter.state';
import { getStateLabelEntries } from '@/utils';

const NAME_LABELS = getStateLabelEntries(
  {
    label: 'Python version',
    state: [filterPython37State, filterPython38State, filterPython39State],
  },
  {
    label: 'Operating system',
    state: [filterLinuxState, filterMacState, filterWindowsState],
  },
  {
    label: 'Development status',
    state: [filterOnlyStablePluginsState],
  },
  {
    label: 'License',
    state: [filterOnlyOpenSourcePluginsState],
  },
);

const VALUE_LABELS = getStateLabelEntries(
  // Python version labels.
  ...PYTHON_LABEL_ENTRIES,

  // Operating system labels.
  ...OPERATING_SYSTEM_LABEL_ENTRIES,

  // Development status labels
  { label: 'Stable', state: filterOnlyStablePluginsState },

  // License status labels
  { label: 'Open Source', state: filterOnlyOpenSourcePluginsState },
);

interface FilterChipProps {
  name: string;
  value: string;
  state: FilterStateType;
}

function FilterChip({ name, value, state }: FilterChipProps) {
  const resetState = useResetAtom(state);

  return (
    <li className="inline-block my-1 ml-1 text-black">
      <Chip
        className="pr-1 bg-napari-hover-gray"
        label={
          <>
            <span>{name}</span>
            <span className="font-bold ml-1">{value}</span>
          </>
        }
        deleteIcon={<Close className="text-black fill-current w-4 h-4" />}
        onDelete={resetState}
      />
    </li>
  );
}

interface Props {
  className?: string;
}

/**
 * Component that renders a list of chips for each enabled filter. Each chip
 * includes a button to disable the filter. It's also possible to clear all the
 * filters by clicking the clear all filters button.
 */
export function FilterChips({ className }: Props) {
  const [filterChips] = useAtom(filterChipState);
  const resetFilterChips = useResetAtom(filterChipState);

  if (isEmpty(filterChips)) {
    return null;
  }

  return (
    <div className={className}>
      {/* Clear filters button */}
      <Button
        classes={{ label: 'underline' }}
        className="inline-block mr-2"
        onClick={resetFilterChips}
      >
        Clear all filters
      </Button>

      {/* Chip list */}
      <ul className="inline flex-wrap gap-2">
        {filterChips.map((state) => {
          const name = NAME_LABELS.get(state) ?? '';
          const value = VALUE_LABELS.get(state) ?? '';

          return (
            <FilterChip
              key={`${name}-${value}`}
              name={name}
              value={value}
              state={state}
            />
          );
        })}
      </ul>
    </div>
  );
}
