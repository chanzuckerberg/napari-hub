import clsx from 'clsx';
import { isFunction } from 'lodash';
import { createElement, HTMLProps, ReactHTML, ReactNode } from 'react';
import { useSnapshot } from 'valtio';

import { MetadataKeys } from '@/context/plugin';
import { useIsPreview } from '@/hooks';
import { previewStore } from '@/store/preview';
import { setUrlHash } from '@/utils';

import { EmptyMetadataTooltip } from './EmptyMetadataTooltip';

type HTMLKey = keyof ReactHTML;
type RenderFn = (tooltip: ReactNode) => ReactNode;

interface Props<T extends HTMLKey> extends HTMLProps<ReactHTML[T]> {
  children: ReactNode | RenderFn;
  className?: string;
  tooltipClassName?: string;
  component?: T;
  highlight?: boolean;
  id?: MetadataKeys;
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
  tooltipClassName,
  ...props
}: Props<T>) {
  const isPreview = useIsPreview();
  const snap = useSnapshot(previewStore);
  const isActive = snap.activeMetadataField === id;

  const tooltipNode = (
    <>
      {isPreview && highlight && (
        <EmptyMetadataTooltip className={tooltipClassName} metadataId={id} />
      )}
    </>
  );
  const childNode = isFunction(children) ? (
    children(tooltipNode)
  ) : (
    <>
      {children}
      {tooltipNode}
    </>
  );

  return createElement(
    // Use `button` when metadata is missing so that users can click on the
    // metadata field to show / hide the tooltip.
    isPreview && highlight ? 'button' : component ?? 'div',
    {
      ...props,

      id,

      className: clsx(
        className,
        isPreview &&
          highlight && [
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
    },
    childNode,
  );
}
