import { useMemo } from 'react';

import { MonthlyStatsChart } from '@/components/ActivityDashboard/MonthlyStatsChart';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';
import { DataPoint } from '@/types/stats';

// TODO Replace with actual requests to the backend
export function MonthlyCommits() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);

  const dataPoints = useMemo<DataPoint[]>(
    () =>
      metrics?.activity.timeline.map((point) => ({
        x: new Date(point.timestamp).getTime(),
        y: point.installs,
      })) ?? [],
    [metrics?.activity.timeline],
  );

  return (
    <MonthlyStatsChart
      dataPoints={dataPoints}
      dateLineI18nKey="activity:monthlyCommits.created"
      dateLineLabelYOffset={-10}
      emptyI18nKey="activity:noData.monthly"
      fill="#80d1ff"
      isLoading={isLoading}
      startDate={plugin?.first_released}
      titleI18nKey="activity:monthlyCommits.title"
      yLabelI18nKey="activity:monthlyCommits.yLabel"
    />
  );
}
