import clsx from 'clsx';
import { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ColumnLayout({ children, ...props }: Props) {
  return (
    <div
      className={clsx(
        // Layout
        'flex 2xl:grid 2xl:justify-center',

        // Padding
        'p-6 md:p-14 2xl:px-0',

        // Grid gap
        '2xl:gap-14',

        // Grid columns
        '2xl:grid-cols-napari-2-col 3xl:grid-cols-napari-3-col',
      )}
      {...props}
    >
      {children}
    </div>
  );
}
