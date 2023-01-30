import { TotalStats } from '@/components/ActivityDashboard/TotalStats';
import { usePluginState } from '@/context/plugin';
import { usePluginMetrics } from '@/hooks';

export function TotalInstalls() {
  const { plugin } = usePluginState();
  const { data: metrics, isLoading } = usePluginMetrics(plugin?.name);
  const stats = metrics?.usage.stats;

  return (
    <TotalStats
      count={stats?.installs_in_last_30_days}
      countI18nKey="activity:installs"
      date={plugin?.first_released}
      infoI18nKey="activity:totalInstalls.publiclyReleased"
      isLoading={isLoading}
    />
  );
}
