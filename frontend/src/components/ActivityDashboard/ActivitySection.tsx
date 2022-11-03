import clsx from 'clsx';
import { ReactNode } from 'react';

import { Text } from '@/components/Text';

interface Props {
  children: ReactNode;
  title: string;
}

export function ActivitySection({ children, title }: Props) {
  return (
    <section>
      <Text className="mb-sds-xl screen-495:mb-sds-l" variant="h2">
        {title}
      </Text>

      <div
        className={clsx(
          'grid grid-cols-1',
          'gap-x-12 gap-y-sds-xl',
          'screen-600:grid-cols-napari-2',
          'screen-875:grid-cols-napari-3',
        )}
      >
        {children}
      </div>
    </section>
  );
}
