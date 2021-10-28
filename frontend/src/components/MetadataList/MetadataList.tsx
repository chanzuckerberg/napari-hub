import clsx from 'clsx';
import { ReactNode } from 'react';
import { useSnapshot } from 'valtio';

import { MetadataKeys } from '@/context/plugin';
import { useIsPreview } from '@/hooks';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';
import { previewStore } from '@/store/preview';

import { EmptyListItem } from './EmptyListItem';
import { MetadataContextProvider } from './metadata.context';
import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  empty?: boolean;
  id?: MetadataKeys;
  inline?: boolean;
  title: string;
}

/**
 * Component for rendering plugin metadata values as a titled list.
 */
export function MetadataList({
  children,
  className,
  compact,
  empty,
  id,
  inline,
  title,
}: Props) {
  usePreviewClickAway(id);
  const isPreview = useIsPreview();
  const snap = useSnapshot(previewStore);

  return (
    // Pass list props in context so that list items can render differently
    // depending on the list props.
    <MetadataContextProvider empty={!!empty} inline={!!inline}>
      {/*
        Use list wrapper so that the preview highlight overlay only renders as
        tall as the content.
       */}
      <div id={id} className={clsx('text-sm', className)}>
        {/* List container */}
        <div
          className={clsx(
            // Render overlay if the list is empty.
            isPreview &&
              empty && [
                'bg-napari-preview-orange-overlay border-2',
                snap.activeMetadataField === id
                  ? 'border-napari-preview-orange'
                  : 'border-transparent',
              ],
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
