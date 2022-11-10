import Skeleton from '@mui/material/Skeleton';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import {
  useDateBucketType,
  useFormattedDuration,
  usePluginInstallStats,
} from '@/hooks';

enum DateBucketType {
  LessThanAWeek,
  OverAWeek,
  OverNWeeks,
  OverNMonths,
  OverNYears,
}

export function TotalInstalls() {
  const { plugin } = usePluginState();
  const { pluginStats, isLoading } = usePluginInstallStats(plugin?.name);

  const { t, i18n } = useTranslation(['activity']);
  const installsFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [i18n.language],
  );
  const formattedInstalls = useMemo(
    () => installsFormatter.format(pluginStats?.totalInstalls ?? 0),
    [installsFormatter, pluginStats?.totalInstalls],
  );

  const date = useMemo(
    () => dayjs(plugin?.release_date),
    [plugin?.release_date],
  );

  const dateBucketType = useDateBucketType(date);
  const formattedDate = useFormattedDuration(date, dateBucketType);

  return (
    <Text className="font-light max-w-napari-col" element="p" variant="h2">
      <span className="!font-medium inline-flex items-center mr-2">
        {isLoading ? (
          <Skeleton className="mr-2" width={32} />
        ) : (
          formattedInstalls
        )}{' '}
        {t('activity:installs')}
      </span>

      <span className="mr-2">
        {t('activity:totalInstalls.publiclyReleased')}{' '}
        {t(
          dateBucketType === DateBucketType.LessThanAWeek
            ? 'activity:duration.lessThan'
            : 'activity:duration.over',
        )}
      </span>

      <div className="!font-medium inline-flex items-center">
        {isLoading ? <Skeleton className="mr-2" width={32} /> : formattedDate}
        {isLoading && ' ago'}
      </div>
    </Text>
  );
}
