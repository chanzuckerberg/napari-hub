import { RecentStats } from '@/components/ActivityDashboard/RecentStats';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

export function RecentCommit() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.maintenance.stats;

  return (
    <RecentStats
      date={stats?.latest_commit_timestamp}
      infoI18nKey="activity:recentCommit.latest"
      isLoading={isLoading}
    />
  );
}
