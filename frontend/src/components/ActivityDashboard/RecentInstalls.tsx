import { useTranslation } from 'next-i18next';

import { Text } from '@/components/Text';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

import { InstallsText } from './InstallsText';

export function RecentInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.activity.stats;

  const { t } = useTranslation(['activity']);

  return (
    <Text className="font-light" element="p" variant="h2">
      <InstallsText
        installs={stats?.installsInLast30Days}
        isLoading={isLoading}
      />

      <span className="mr-2">{t('activity:recentInstalls.inPast')}</span>

      <span className="!font-medium">{t('activity:duration.30days')}</span>
    </Text>
  );
}
