import clsx from 'clsx';
import { createElement, HTMLProps, ReactHTML, ReactNode } from 'react';
import { useSnapshot } from 'valtio';

import { MetadataId } from '@/context/plugin';
import { previewStore } from '@/store/preview';
import { setUrlHash } from '@/utils';

import { EmptyMetadataTooltip } from './EmptyMetadataTooltip';

type HTMLKey = keyof ReactHTML;

interface Props<T extends HTMLKey> extends HTMLProps<ReactHTML[T]> {
  children: ReactNode;
  className?: string;
  component?: T;
  highlight?: boolean;
  metadataId?: MetadataId;
  tooltip?: ReactNode;
  variant?: 'regular' | 'small';
}

/**
 * Component for rendering an overlay around missing plugin metadata on the
 * preview page. This
 */
export function MetadataHighlighter<T extends HTMLKey>({
  children,
  className,
  component,
  highlight = false,
  metadataId,
  tooltip,
  variant,
  ...props
}: Props<T>) {
  const snap = useSnapshot(previewStore);
  const isActive = snap.activeMetadataField === metadataId;
  const highlightEnabled = process.env.PREVIEW && highlight;

  const childNode = (
    <>
      {children}

      {highlightEnabled && (
        <>
          {tooltip !== undefined ? (
            tooltip
          ) : (
            <EmptyMetadataTooltip metadataId={metadataId} />
          )}
        </>
      )}
    </>
  );

  return createElement(
    // Use `button` when metadata is missing so that users can click on the
    // metadata field to show / hide the tooltip.
    highlightEnabled ? 'button' : component ?? 'div',
    {
      ...props,

      id: metadataId,

      className: clsx(
        className,

        highlightEnabled && [
          // Override button styles.
          'text-left w-full',

          // I can't believe this works, but it does and it's amazing. The
          // designs ask for the highlight boxes to flow outside of the grid
          // layout. This is tricky to do and my initial impression was to use
          // negative margins. However, CSS transforms do not affect the box
          // model, so if we simply scale the highlighter a little bit and use
          // padding for alignment, we can achieve the overflow effect.
          variant === 'small' ? 'p-1' : 'p-2',
          'scale-[1.03]',

          // Give button border initially so that the space is reserved.
          'border-2',

          isActive
            ? [
                // Render button with orange border and darker overlay color when active.
                'border-napari-preview-orange',
                'bg-napari-preview-orange-overlay-active',
              ]
            : [
                // Render border transparent and only show darker overlay color
                // when hovering.
                'border-transparent',
                'bg-napari-preview-orange-overlay',
                'hover:bg-napari-preview-orange-overlay-active',
              ],
        ],
      ),

      // Attach click listener when the component is a button.
      ...(highlightEnabled
        ? {
            onClick(event: MouseEvent) {
              // Stop propogation so that the event doesn't bubble up to
              // `usePreviewClickAway()` event listeners.
              event.stopPropagation();

              // If the clicked metadata ID matches the active ID, then clear the
              // active ID state. Otherwise, set it to the clicked metadata ID.
              const nextId =
                metadataId && metadataId !== snap.activeMetadataField
                  ? metadataId
                  : '';
              previewStore.activeMetadataField = nextId;

              // Replace current URL with active metadata ID.
              setUrlHash(nextId);
            },
          }
        : {}),
    },
    childNode,
  );
}
