import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import Close from '@material-ui/icons/Close';
import { isEmpty, set } from 'lodash';
import { useSnapshot } from 'valtio';

import {
  filterChipsStore,
  resetFilters,
  searchFormStore,
} from '@/store/search/form.store';

/**
 * Labels to render for a particular state key.
 */
const KEY_LABELS: Record<string, string> = {
  developmentStatus: 'Development status',
  license: 'License',
  operatingSystems: 'Operating system',
  pythonVersions: 'Python version',
};

/**
 * Labels to render for a particular sub-state key.
 *
 * TODO Find a better way to add typing for this to prevent discrepancies
 * between the state data and the labels.
 */
const VALUE_LABEL: Record<string, string | undefined> = {
  // Dev Status labels
  stable: 'Stable',

  // License labels
  openSource: 'Open Source',

  // OS labels
  linux: 'Linux',
  mac: 'macOS',
  windows: 'Windows',
};

interface Props {
  className?: string;
}

function ClearFiltersButton() {
  const { filterChips } = useSnapshot(filterChipsStore);

  if (isEmpty(filterChips)) {
    return null;
  }

  return (
    <Button
      classes={{ label: 'underline' }}
      className="inline-block mr-2"
      onClick={resetFilters}
    >
      Clear all filters
    </Button>
  );
}

function FilterChipItems() {
  const { filterChips } = useSnapshot(filterChipsStore);

  if (isEmpty(filterChips)) {
    return null;
  }

  return (
    <>
      {filterChips.map(({ key, value }) => (
        <li
          className="inline-block my-1 ml-1 text-black"
          key={`${key}-${value}`}
        >
          <Chip
            className="pr-1 bg-napari-hover-gray"
            label={
              <>
                <span>{KEY_LABELS[key]}</span>
                <span className="font-bold ml-1">
                  {VALUE_LABEL[value] ?? value}
                </span>
              </>
            }
            deleteIcon={<Close className="text-black fill-current w-4 h-4" />}
            onDelete={() => set(searchFormStore.filters, [key, value], false)}
          />
        </li>
      ))}
    </>
  );
}

/**
 * Component that renders a list of chips for each enabled filter. Each chip
 * includes a button to disable the filter. It's also possible to clear all the
 * filters by clicking the clear all filters button.
 */
export function FilterChips({ className }: Props) {
  return (
    <div className={className}>
      {/* Clear filters button */}
      <ClearFiltersButton />

      {/* Chip list */}
      <ul className="inline flex-wrap gap-2">
        <FilterChipItems />
      </ul>
    </div>
  );
}
