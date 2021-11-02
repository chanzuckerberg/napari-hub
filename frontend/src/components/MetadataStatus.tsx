import clsx from 'clsx';

import { Check, PriorityHigh } from '@/components/common/icons';

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
        variant === 'small' ? 'w-2 h-2' : 'w-[0.9375rem] h-[0.9375rem]',
      )}
    >
      {hasValue ? <Check /> : <PriorityHigh color="#fff" />}
    </div>
  );
}
