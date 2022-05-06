import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './AnchorHeading.module.scss';

interface Props {
  id?: string;
  className?: string;
  children?: ReactNode;
}

export function AnchorHeading({ className, children, id, ...props }: Props) {
  return (
    <h2
      id={id}
      className={clsx(className, styles.heading2, 'flex space-x-2')}
      {...props}
    >
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
    </h2>
  );
}
