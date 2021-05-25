import clsx from 'clsx';
import {
  createElement,
  HTMLProps,
  MutableRefObject,
  ReactHTML,
  ReactNode,
} from 'react';

interface Classes {
  gap: string;
  twoColumn: string;
  threeColumn: string;
  fourColumn: string;
  fiveColumn: string;
}

type HTMLKey = keyof ReactHTML;

interface Props<T extends HTMLKey, Ref> extends HTMLProps<ReactHTML[T]> {
  /**
   * Children to render as columns. The 1st, 2nd, and 3rd child nodes are used
   * for the 1st, 2nd, and 3rd columns, respectively.
   */
  children: ReactNode;

  /**
   * CSS classes to override component classes.
   */
  classes?: Partial<Classes>;

  /**
   * Root component to use for column layout. The default is `div`.
   */
  component?: T;

  innerRef?: MutableRefObject<Ref>;
}

const defaultClasses: Classes = {
  gap: 'gap-6 md:gap-12',
  twoColumn: 'grid-cols-2',
  threeColumn: 'screen-875:grid-cols-napari-3',
  fourColumn: 'screen-1150:grid-cols-napari-4',
  fiveColumn: 'screen-1425:grid-cols-napari-5',
};

/**
 * Component for rendering napari's column layout.
 */
export function ColumnLayout<T extends HTMLKey, Ref = never>({
  children,
  classes = {},
  className,
  component,
  innerRef,
  ...props
}: Props<T, Ref>) {
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
      ref: innerRef,
      ...props,
    },
    children,
  );
}
