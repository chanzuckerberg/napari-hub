import clsx from 'clsx';
import { ReactNode } from 'react';

import { useIsPreview } from '@/hooks';

import { EmptyListItem } from './EmptyListItem';
import { MetadataContextProvider } from './metadata.context';
import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
  title: string;
  inline?: boolean;
  compact?: boolean;
  empty?: boolean;
}

/**
 * Component for rendering plugin metadata values as a titled list.
 */
export function MetadataList({
  children,
  className,
  compact,
  empty,
  title,
  inline,
}: Props) {
  const isPreview = useIsPreview();

  return (
    // Pass list props in context so that list items can render differently
    // depending on the list props.
    <MetadataContextProvider empty={!!empty} inline={!!inline}>
      {/*
        Use list wrapper so that the preview highlight overlay only renders as
        tall as the content.
       */}
      <div className={clsx('text-sm', className)}>
        {/* List container */}
        <div
          className={clsx(
            // Render overlay if the list is empty.
            isPreview && empty && 'bg-napari-preview-orange-overlay',

            // Item spacing for inline lists.
            inline && 'space-x-2',

            // Vertical spacing.
            'space-y-2',
          )}
        >
          {/* List title */}
          <h4
            className={clsx(
              // Font
              'font-bold whitespace-nowrap',

              // Render title inline with values.
              inline && 'inline',
            )}
          >
            {title}:
          </h4>

          {/* List values */}
          <ul
            className={clsx(
              'list-none text-sm leading-normal',

              // Vertical and horizontal spacing.
              inline
                ? ['inline space-y-2', styles.inlineList]
                : [compact ? 'space-y-2' : 'space-y-5'],
            )}
          >
            {empty ? <EmptyListItem /> : children}
          </ul>
        </div>
      </div>
    </MetadataContextProvider>
  );
}
