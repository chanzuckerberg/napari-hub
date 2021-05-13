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

  /**
   * Most layouts use the `225px 775px` for the 2-column layout, but some
   * require the layout to be `775px 225px`. For example, the plugin details
   * page needs this for the plugin summary and TOC.
   */
  reverseTwoColumn?: boolean;
}

export function ColumnLayout({
  children,
  className,
  component = 'div',
  reverseTwoColumn,
  ...props
}: Props) {
  // Use `createElement()` to dynamically create element from `component` prop.
  return createElement(
    component,
    {
      className: clsx(
        className,

        // Layout
        'grid grid-cols-1 justify-center',

        // Grid gap
        'gap-6 md:gap-12',

        // 2-column grid
        reverseTwoColumn
          ? '2xl:grid-cols-napari-2-col-reverse'
          : '2xl:grid-cols-napari-2-col',

        // 3-column grid
        '3xl:grid-cols-napari-3-col',
      ),
      ...props,
    },
    children,
  );
}
