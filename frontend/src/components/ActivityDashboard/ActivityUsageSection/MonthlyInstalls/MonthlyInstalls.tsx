import { useMemo } from 'react';

import { MonthlyStatsChart } from '@/components/ActivityDashboard/MonthlyStatsChart';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';
import { DataPoint } from '@/types/metrics';

export function MonthlyInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);

  const dataPoints = useMemo<DataPoint[]>(
    () =>
      metrics?.usage.timeline.map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: point.installs,
      })) ?? [],
    [metrics?.usage.timeline],
  );

  return (
    <MonthlyStatsChart
      dataPoints={dataPoints}
      dateLineI18nKey="activity:monthlyInstalls.publicRelease"
      emptyI18nKey="activity:noData.monthly"
      isLoading={isLoading}
      startDate={plugin?.first_released}
      titleI18nKey="activity:monthlyInstalls.title"
      yLabelI18nKey="activity:monthlyInstalls.yLabel"
    />
  );
}
