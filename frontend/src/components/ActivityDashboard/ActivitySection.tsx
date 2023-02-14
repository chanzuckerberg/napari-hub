import clsx from 'clsx';
import { ReactNode } from 'react';

import { Text } from '@/components/Text';

interface Props {
  children: ReactNode;
  className?: string;
  grid?: boolean;
  title: string;
}

export function ActivitySection({
  children,
  className,
  grid = true,
  title,
}: Props) {
  let content = children;

  if (grid) {
    content = (
      <div
        className={clsx(
          'grid justify-center',
          'gap-x-12 gap-y-sds-xl',
          'grid-cols-1',
          'screen-600:grid-cols-2',
          'screen-875:grid-cols-napari-3',
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <section className={className}>
      <Text className="mb-sds-xl screen-495:mb-sds-l" variant="h2">
        {title}
      </Text>

      {content}
    </section>
  );
}
