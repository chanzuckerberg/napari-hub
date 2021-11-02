import clsx from 'clsx';
import { createElement, HTMLProps, ReactHTML, ReactNode } from 'react';
import { useSnapshot } from 'valtio';

import { MetadataKeys } from '@/context/plugin';
import { useIsPreview } from '@/hooks';
import { previewStore } from '@/store/preview';
import { setUrlHash } from '@/utils';

import { EmptyMetadataTooltip } from './EmptyMetadataTooltip';

type HTMLKey = keyof ReactHTML;

interface Props<T extends HTMLKey> extends HTMLProps<ReactHTML[T]> {
  children: ReactNode;
  className?: string;
  component?: T;
  highlight?: boolean;
  id?: MetadataKeys;
  tooltip?: ReactNode;
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
  id,
  tooltip,
  ...props
}: Props<T>) {
  const isPreview = useIsPreview();
  const snap = useSnapshot(previewStore);
  const isActive = snap.activeMetadataField === id;
  const highlightEnabled = isPreview && highlight;

  const childNode = (
    <>
      {children}

      {tooltip !== undefined ? (
        tooltip
      ) : (
        <>{highlightEnabled && <EmptyMetadataTooltip metadataId={id} />}</>
      )}
    </>
  );

  return createElement(
    // Use `button` when metadata is missing so that users can click on the
    // metadata field to show / hide the tooltip.
    highlightEnabled ? 'button' : component ?? 'div',
    {
      ...props,

      id,

      className: clsx(
        className,

        highlightEnabled && [
          // Override button styles.
          'text-left w-full',

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
              const nextId = id && id !== snap.activeMetadataField ? id : '';
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
