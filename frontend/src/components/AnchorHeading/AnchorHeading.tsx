import clsx from 'clsx';
import { ComponentType, createElement, ReactNode } from 'react';
import { HeadingProps } from 'react-markdown/lib/ast-to-react';

import styles from './AnchorHeading.module.scss';

interface Props extends Omit<HeadingProps, 'children' | 'node' | 'level'> {
  element: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children?: ReactNode;
}

export function AnchorHeading({
  className,
  element,
  children,
  id,
  ...props
}: Props) {
  return createElement(
    element,
    {
      id,
      className: clsx(className, styles.heading, 'flex space-x-2'),
      ...props,
    },
    <>
      <span>{children}</span>

      {id && (
        <a
          className={clsx(
            styles.anchor,
            'opacity-0 !text-napari-dark-gray !no-underline',
            'hover:!text-napari-primary',
          )}
          href={`#${id}`}
        >
          ¶
        </a>
      )}
    </>,
  );
}

type GetAnchorHeadingProps = Omit<HeadingProps, 'element'>;

export function getAnchorHeading(
  element: Props['element'],
): ComponentType<GetAnchorHeadingProps> {
  function GetAnchorHeader(props: GetAnchorHeadingProps) {
    return <AnchorHeading element={element} {...props} />;
  }

  return GetAnchorHeader;
}
