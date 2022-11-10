import clsx from 'clsx';
import { ReactNode } from 'react';

import { Text } from '@/components/Text';

interface Props {
  className?: string;
  children: ReactNode;
}

/**
 * Component for rendering empty stack box for different sections in the
 * activity dashboard.
 */
export function EmptyState({ className, children }: Props) {
  return (
    <div
      className={clsx(
        'bg-gray-100 flex items-center justify-center',
        className,
      )}
    >
      <Text className="font-normal italic text-center" element="p" variant="h5">
        {children}
      </Text>
    </div>
  );
}
