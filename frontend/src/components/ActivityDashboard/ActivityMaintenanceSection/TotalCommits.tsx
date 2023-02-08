import { TotalStats } from '@/components/ActivityDashboard/TotalStats';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

export function TotalCommits() {
  const { plugin, repo } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.maintenance.stats;

  return (
    <TotalStats
      count={stats?.total_commits ?? 0}
      countI18nKey="activity:commits"
      date={repo.createdAt}
      infoI18nKey="activity:totalCommits.repoCreated"
      isLoading={isLoading}
    />
  );
}
