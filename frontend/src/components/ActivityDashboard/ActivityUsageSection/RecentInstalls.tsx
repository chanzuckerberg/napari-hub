import { RecentStats } from '@/components/ActivityDashboard/RecentStats';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

export function RecentInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.activity.stats;

  return (
    <RecentStats
      count={stats?.installsInLast30Days}
      countI18nKey="activity:installs"
      durationI18nKey="activity:duration.30days"
      infoI18nKey="activity:recentInstalls.inPast"
      isLoading={isLoading}
    />
  );
}
