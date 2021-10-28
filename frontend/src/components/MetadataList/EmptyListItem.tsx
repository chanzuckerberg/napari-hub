import clsx from 'clsx';
import { ReactNode } from 'react';

import { useMetadataContext } from './metadata.context';

interface Props {
  children?: ReactNode;
}

/**
 * Renders a special list item informing the user that the metadata has no
 * supplied value.
 */
export function EmptyListItem({ children }: Props) {
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

      {children}
    </li>
  );
}
