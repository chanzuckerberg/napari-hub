import { Button, Chip } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { isEmpty } from 'lodash';

import { useSearchState } from '@/context/search';
import { FilterFormState } from '@/context/search/filter.types';

/**
 * Labels to render for a particular state key.
 */
const KEY_LABELS: Record<keyof FilterFormState, string> = {
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
const SUBKEY_LABEL: Record<string, string | undefined> = {
  // Dev Status labels
  onlyStablePlugins: 'Stable',

  // License labels
  onlyOpenSourcePlugins: 'Open Source',

  // OS labels
  linux: 'Linux',
  mac: 'macOS',
  windows: 'Windows',
};

interface Props {
  className?: string;
}

/**
 * Component that renders a list of chips for each enabled filter. Each chip
 * includes a button to disable the filter. It's also possible to clear all the
 * filters by clicking the clear all filters button.
 */
export function FilterChips({ className }: Props) {
  const { filter } = useSearchState() ?? {};

  if (isEmpty(filter?.chips)) {
    return null;
  }

  return (
    <div className={className}>
      {/* Clear filters button */}
      <Button
        classes={{ label: 'underline' }}
        className="inline-block mr-2"
        onClick={() => filter?.clearAll()}
      >
        Clear all filters
      </Button>

      {/* Chip list */}
      <ul className="inline flex-wrap gap-2">
        {filter?.chips.map(({ id, key, subKey }) => (
          <li className="inline-block my-1 ml-1" key={id}>
            <Chip
              label={
                <>
                  <span>{KEY_LABELS[key]}</span>
                  <span className="font-bold ml-1">
                    {SUBKEY_LABEL[subKey] ?? subKey}
                  </span>
                </>
              }
              deleteIcon={<Close className="text-black fill-current w-4 h-4" />}
              onDelete={() => filter?.removeChip(key, subKey)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
