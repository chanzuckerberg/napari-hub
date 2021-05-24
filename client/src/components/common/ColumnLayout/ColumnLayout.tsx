import clsx from 'clsx';
import { createElement, HTMLProps, ReactHTML, ReactNode } from 'react';

import { NonPartial } from '@/types';

interface Classes {
  gap?: string;
  twoColumn?: string;
  threeColumn?: string;
  fourColumn?: string;
  fiveColumn?: string;
}

type HTMLKey = keyof ReactHTML;

interface Props<T extends HTMLKey> extends HTMLProps<ReactHTML[T]> {
  /**
   * Children to render as columns. The 1st, 2nd, and 3rd child nodes are used
   * for the 1st, 2nd, and 3rd columns, respectively.
   */
  children: ReactNode;

  /**
   * CSS classes to override component classes.
   */
  classes?: Classes;

  /**
   * Root component to use for column layout. The default is `div`.
   */
  component?: T;
}

const defaultClasses: NonPartial<Classes> = {
  gap: 'gap-6 md:gap-12',
  twoColumn: 'grid-cols-2',
  threeColumn: 'screen-875:grid-cols-napari-3',
  fourColumn: 'screen-1150:grid-cols-napari-4',
  fiveColumn: 'screen-1425:grid-cols-napari-5',
};

/**
 * Component for rendering napari's column layout.
 */
export function ColumnLayout<T extends HTMLKey>({
  children,
  classes = {},
  className,
  component,
  ...props
}: Props<T>) {
  // Use `createElement()` to dynamically create element from `component` prop.
  return createElement(
    component ?? 'div',
    {
      className: clsx(
        className,

        // Grid Layout
        'grid justify-center',

        Object.values({
          // Default classes for component.
          ...defaultClasses,

          // Override classes if any.
          ...classes,
        }),
      ),
      ...props,
    },
    children,
  );
}
