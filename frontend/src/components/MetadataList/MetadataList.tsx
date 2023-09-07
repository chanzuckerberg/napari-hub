import clsx from 'clsx';
import { ReactNode } from 'react';

import { EmptyListItem } from './EmptyListItem';
import { MetadataContextProvider } from './metadata.context';
import styles from './MetadataList.module.scss';

export interface Props {
  children: ReactNode;
  className?: string;
  empty?: boolean;
  inline?: boolean;
  inlineList?: boolean;
  label: string;
}

/**
 * Component for rendering plugin metadata values as a titled list.
 */
export function MetadataList({
  children,
  className,
  empty,
  inline,
  inlineList,
  label,
}: Props) {
  return (
    // Pass list props in context so that list items can render differently
    // depending on the list props.
    <MetadataContextProvider empty={!!empty} inline={!!inline}>
      <div className={clsx('text-sm', className)}>
        {/* List container */}
        <div
          className={clsx(
            // Item spacing for inline lists.
            inline && [
              empty ? 'flex items-center screen-875:inline' : 'inline',
            ],
          )}
        >
          {/* List title */}
          <p
            className={clsx(
              // Font
              'font-bold whitespace-nowrap',

              // Render title inline with values.
              inline && 'inline mr-sds-s',
            )}
          >
            {label}:
          </p>

          {/* List values */}
          <ul
            className={clsx(
              styles.list,
              'list-none text-sm leading-normal',

              // Vertical and horizontal spacing.
              (inline || inlineList) && [
                'inline space-y-sds-s',
                empty && 'flex-grow',
                styles.inline,
              ],
            )}
          >
            {empty ? <EmptyListItem /> : children}
          </ul>
        </div>
      </div>
    </MetadataContextProvider>
  );
}
