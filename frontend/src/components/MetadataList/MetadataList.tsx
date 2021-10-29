import clsx from 'clsx';
import { ReactNode } from 'react';

import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { EmptyMetadataTooltip } from '@/components/MetadataHighlighter/EmptyMetadataTooltip';
import { MetadataKeys } from '@/context/plugin';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';

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
              inline && 'inline mr-2',
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
                ? ['inline space-y-2', empty && 'flex-grow', styles.inlineList]
                : [compact ? 'space-y-2' : 'space-y-5'],
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
