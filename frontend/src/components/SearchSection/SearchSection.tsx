import clsx from 'clsx';
import { ReactNode } from 'react';

import { Text } from '@/components/Text';

interface Props {
  title: string;
  subtitle?: ReactNode;
  searchBar: ReactNode;
}

export function SearchSection({ title, subtitle, searchBar }: Props) {
  return (
    <div
      className={clsx(
        'bg-hub-primary-200 p-6 screen-495:p-12',

        // Grid layout
        'gap-x-sds-xl screen-495:gap-x-12',
        'grid justify-center grid-cols-2',
        'screen-875:grid-cols-napari-3',
        'screen-1150:grid-cols-napari-5',
      )}
    >
      <div
        className={clsx(
          'col-span-2',
          'screen-875:col-span-3 screen-875:col-start-1',
          'screen-1150:col-start-2 screen-1150:col-span-3',
        )}
      >
        <div className="flex items-end mb-6 justify-between screen-495:justify-start screen-495:gap-3">
          <Text variant="h1" element="h2">
            {title}
          </Text>

          {subtitle}
        </div>

        {searchBar}
      </div>
    </div>
  );
}
