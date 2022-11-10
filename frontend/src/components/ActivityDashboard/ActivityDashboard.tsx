import { useMemo } from 'react';

import { I18n } from '@/components/I18n';
import { usePluginState } from '@/context/plugin';
import { usePluginActivity, usePluginInstallStats } from '@/hooks';
import { usePluginRecentInstallStats } from '@/hooks/usePluginRecentInstallStats';

import { ActivityUsageSection } from './ActivityUsageSection';
import { EmptyState } from './EmptyState';

export function ActivityDashboard() {
  const { plugin } = usePluginState();
  const { pluginStats, isLoading: isPluginStatsLoading } =
    usePluginInstallStats(plugin?.name);
  const { pluginRecentStats, isLoading: isPluginRecentStatsLoading } =
    usePluginRecentInstallStats(plugin?.name);
  const { dataPoints, isLoading: isPluginActivityLoading } = usePluginActivity(
    plugin?.name,
    {
      enabled: !!plugin?.name,
    },
  );

  const isEmpty = useMemo(() => {
    if (
      isPluginStatsLoading ||
      isPluginRecentStatsLoading ||
      isPluginActivityLoading
    ) {
      return false;
    }

    return !pluginStats && !pluginRecentStats && dataPoints.length === 0;
  }, [
    dataPoints.length,
    isPluginActivityLoading,
    isPluginRecentStatsLoading,
    isPluginStatsLoading,
    pluginRecentStats,
    pluginStats,
  ]);

  return (
    <div>
      {isEmpty ? (
        <EmptyState className="h-[75px] screen-495:h-[125px]">
          <I18n i18nKey="activity:noData.allData" />
        </EmptyState>
      ) : (
        <ActivityUsageSection />
      )}
    </div>
  );
}
