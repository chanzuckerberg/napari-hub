import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { useDateBucketType, useFormattedDuration } from '@/hooks';

interface Props {
  date?: dayjs.ConfigType;
  isLoading?: boolean;
}

export function FormattedDuration({ date: dateConfig, isLoading }: Props) {
  const date = useMemo(() => dayjs(dateConfig), [dateConfig]);
  const dateBucketType = useDateBucketType(date);
  const formattedDuration = useFormattedDuration(date, dateBucketType);

  return (
    <div className="!font-medium inline-flex items-center">
      {isLoading ? <Skeleton className="mr-2" width={32} /> : formattedDuration}
      {isLoading && ' ago'}
    </div>
  );
}
