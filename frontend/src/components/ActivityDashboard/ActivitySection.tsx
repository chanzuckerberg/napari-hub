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

      {children}
    </section>
  );
}
