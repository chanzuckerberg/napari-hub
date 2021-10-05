import clsx from 'clsx';

import { Check, PriorityHigh } from '@/components/common/icons';

interface MetadataStatusProps {
  hasValue: boolean;
}

export function MetadataStatus({ hasValue }: MetadataStatusProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        hasValue ? 'bg-napari-primary' : 'bg-napari-preview-orange',
      )}
    >
      {hasValue ? <Check /> : <PriorityHigh color="#fff" />}
    </div>
  );
}
