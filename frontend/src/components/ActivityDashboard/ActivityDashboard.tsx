import { useMemo } from 'react';

import { I18n } from '@/components/I18n';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

import { ActivityUsageSection } from './ActivityUsageSection';
import { EmptyState } from './EmptyState';

export function ActivityDashboard() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);

  const isEmpty = useMemo(() => {
    if (isLoading) {
      return false;
    }

    if (!metrics) {
      return true;
    }

    const { timeline, stats } = metrics.activity;

    // Check if timeline is empty and all stats values are 0
    return [timeline.length, Object.values(stats)].every(
      (value) => value === 0,
    );
  }, [isLoading, metrics]);

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
