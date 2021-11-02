import clsx from 'clsx';
import { ReactNode } from 'react';

import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { EmptyMetadataTooltip } from '@/components/MetadataHighlighter/EmptyMetadataTooltip';
import { MetadataKeys } from '@/context/plugin';
import { useIsPreview } from '@/hooks';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';

import { EmptyListItem } from './EmptyListItem';
import { MetadataContextProvider } from './metadata.context';
import styles from './MetadataList.module.scss';

interface Props {
  children: ReactNode;
  className?: string;
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
  empty,
  id,
  inline,
  title,
}: Props) {
  usePreviewClickAway(id);
  const isPreview = useIsPreview();

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
        <MetadataHighlighter
          className={clsx(
            // Item spacing for inline lists.
            inline && [
              empty ? 'flex items-center screen-875:inline' : 'inline',
            ],
          )}
          highlight={empty}
          tooltip={null}
          id={id}
        >
          {/* List title */}
          <h4
            className={clsx(
              // Font
              'font-bold whitespace-nowrap',

              // Render title inline with values.
              inline ? 'inline mr-2' : 'mb-3',
            )}
          >
            {title}:
          </h4>

          {/* List values */}
          <ul
            className={clsx(
              styles.list,
              'list-none text-sm leading-normal',
              isPreview && styles.preview,

              // Vertical and horizontal spacing.
              inline && [
                'inline space-y-2',
                empty && 'flex-grow',
                styles.inline,
              ],
            )}
          >
            {empty ? (
              <EmptyListItem>
                <EmptyMetadataTooltip metadataId={id} />
              </EmptyListItem>
            ) : (
              children
            )}
          </ul>
        </MetadataHighlighter>
      </div>
    </MetadataContextProvider>
  );
}
