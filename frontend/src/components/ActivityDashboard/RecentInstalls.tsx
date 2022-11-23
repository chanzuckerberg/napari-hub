import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'next-i18next';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { useFormattedNumber, usePluginMetrics } from '@/hooks';

export function RecentInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.activity.stats;

  const { t } = useTranslation(['activity']);
  const formattedInstalls = useFormattedNumber(stats?.installsInLast30Days);

  return (
    <Text className="font-light" element="p" variant="h2">
      <span className="!font-medium inline-flex items-center mr-2">
        {isLoading ? (
          <Skeleton className="mr-2" width={32} />
        ) : (
          formattedInstalls
        )}{' '}
        {t('activity:installs')}
      </span>

      <span className="mr-2">{t('activity:recentInstalls.inPast')}</span>

      <span className="!font-medium">{t('activity:duration.30days')}</span>
    </Text>
  );
}
