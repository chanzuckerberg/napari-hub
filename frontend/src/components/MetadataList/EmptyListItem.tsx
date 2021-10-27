import { Tooltip } from '@material-ui/core';
import clsx from 'clsx';

import { MetadataStatus } from '@/components/MetadataStatus';

import { useMetadataContext } from './metadata.context';

/**
 * Renders a special list item indicating to inform the user that the metadata
 * has no supplied value.
 */
export function EmptyListItem() {
  const { inline } = useMetadataContext();

  return (
    <li
      className={clsx(
        'flex justify-between items-center',
        inline ? 'inline' : 'block',
      )}
    >
      <span className="text-napari-gray font-normal">
        information not submitted
      </span>

      <Tooltip placement="right" title="MetadataStatus Text Placeholder">
        <div>
          <MetadataStatus hasValue={false} />
        </div>
      </Tooltip>
    </li>
  );
}
