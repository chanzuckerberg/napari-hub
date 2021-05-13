import clsx from 'clsx';
import React, { createElement, HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  /**
   * Children to render as columns. The 1st, 2nd, and 3rd child nodes are used
   * for the 1st, 2nd, and 3rd columns, respectively.
   */
  children: ReactNode;

  /**
   * Root component to use for column layout. The default is `div`.
   */
  component?: React.ElementType;
}

/**
 * Component for rendering napari's column layout.
 */
export function ColumnLayout({
  children,
  className,
  component = 'div',
  ...props
}: Props) {
  // Use `createElement()` to dynamically create element from `component` prop.
  return createElement(
    component,
    {
      className: clsx(
        className,

        // Layout
        'grid grid-cols-napari-2 justify-center',

        // Grid gap
        'gap-6 md:gap-12',

        // Use more columns for larger screens
        'xl:grid-cols-napari-3',
        '2xl:grid-cols-napari-4',
        '3xl:grid-cols-napari-5',
      ),
      ...props,
    },
    children,
  );
}
