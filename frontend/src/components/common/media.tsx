import { createMedia } from '@artsy/fresnel';
import { MediaProps } from '@artsy/fresnel/dist/Media';
import clsx from 'clsx';
import { cloneElement, ReactElement } from 'react';

import { breakpoints } from '@/theme';

const AppMedia = createMedia({ breakpoints });

/**
 * Styles for SSR.
 */
export const mediaStyles = AppMedia.createMediaStyle();

export const {
  /**
   * This component provides an easy-to-use API for responding to media
   * queries.  This adds a wrapper div over the component with fresnel CSS
   * classes to respond to media queries.
   *
   * If you don't need the wrapper div, use the MediaFragment component
   * instead.
   */
  Media,

  /**
   * This provides context data related to the media query component.
   */
  MediaContextProvider,
} = AppMedia;

type BreakpointKey = keyof typeof breakpoints;

interface MediaFragmentProps extends MediaProps<BreakpointKey, never> {
  children: ReactElement<{ className?: string }>;
}

/**
 * Wrapper for fresnel's Media component that allows rendering children without
 * a wrapper div, similar to what React fragments do.  For this to work, the
 * children prop needs to:
 *  1. Be an actual component. Fragments won't work.
 *  2. Accept `className` as a prop and passes it to the root element.
 */
export function MediaFragment({
  children,
  className,
  ...props
}: MediaFragmentProps) {
  return (
    <Media {...props}>
      {(mediaClassName, render) =>
        render &&
        cloneElement(children, {
          className: clsx(mediaClassName, className, children.props.className),
        })
      }
    </Media>
  );
}
