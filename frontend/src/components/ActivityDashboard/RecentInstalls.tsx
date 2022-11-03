import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { usePluginRecentInstallStats } from '@/hooks/usePluginRecentInstallStats';

export function RecentInstalls() {
  const { plugin } = usePluginState();
  const { pluginRecentStats, isLoading } = usePluginRecentInstallStats(
    plugin?.name,
  );

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
    () => installsFormatter.format(pluginRecentStats?.installInLast30Days ?? 0),
    [installsFormatter, pluginRecentStats?.installInLast30Days],
  );

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

      <span className="mr-2">{t('activity:recentInstalls.inPast')}</span>

      <div className="!font-medium">{t('activity:duration.30days')}</div>
    </Text>
  );
}
