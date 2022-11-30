import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import {
  useDateBucketType,
  useFormattedDuration,
  usePluginMetrics,
} from '@/hooks';

import { InstallsText } from './InstallsText';

enum DateBucketType {
  LessThanAWeek,
  OverAWeek,
  OverNWeeks,
  OverNMonths,
  OverNYears,
}

export function TotalInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.activity.stats;

  const { t } = useTranslation(['activity']);

  const date = useMemo(
    () => dayjs(plugin?.first_released),
    [plugin?.first_released],
  );

  const dateBucketType = useDateBucketType(date);
  const formattedDuration = useFormattedDuration(date, dateBucketType);

  return (
    <Text className="font-light" element="p" variant="h2">
      <InstallsText installs={stats?.totalInstalls} isLoading={isLoading} />

      <span className="mr-2">
        {t('activity:totalInstalls.publiclyReleased')}{' '}
        {t(
          dateBucketType === DateBucketType.LessThanAWeek
            ? 'activity:duration.lessThan'
            : 'activity:duration.over',
        )}
      </span>

      <div className="!font-medium inline-flex items-center">
        {isLoading ? (
          <Skeleton className="mr-2" width={32} />
        ) : (
          formattedDuration
        )}
        {isLoading && ' ago'}
      </div>
    </Text>
  );
}
