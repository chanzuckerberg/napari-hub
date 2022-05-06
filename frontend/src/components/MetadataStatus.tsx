import clsx from 'clsx';

import { Check, PriorityHigh } from '@/components/icons';

interface MetadataStatusProps {
  className?: string;
  hasValue: boolean;
  variant?: 'regular' | 'small';
}

export function MetadataStatus({
  className,
  hasValue,
  variant = 'regular',
}: MetadataStatusProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        className,
        hasValue ? 'bg-napari-primary' : 'bg-napari-preview-orange',
        variant === 'small'
          ? 'w-[0.625rem] h-[0.625rem]'
          : 'w-[0.9375rem] h-[0.9375rem]',
      )}
    >
      {hasValue ? <Check /> : <PriorityHigh color="#fff" />}
    </div>
  );
}
