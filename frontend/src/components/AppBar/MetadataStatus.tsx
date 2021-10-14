import clsx from 'clsx';

import { Check, PriorityHigh } from '@/components/common/icons';

interface MetadataStatusProps {
  hasValue: boolean;
  variant?: 'regular' | 'small';
}

export function MetadataStatus({
  hasValue,
  variant = 'regular',
}: MetadataStatusProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        hasValue ? 'bg-napari-primary' : 'bg-napari-preview-orange',
        variant === 'small' && 'w-2 h-2',
      )}
    >
      {hasValue ? <Check /> : <PriorityHigh color="#fff" />}
    </div>
  );
}
