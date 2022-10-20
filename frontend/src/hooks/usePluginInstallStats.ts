import { useQuery } from 'react-query';

import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginInstallStats(plugin?: string) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { data: pluginStats, ...result } = useQuery(
    ['plugin-stats', plugin],
    () => (plugin ? hubAPI.getPluginInstallStats(plugin) : null),
    { enabled: isActivityDashboardEnabled },
  );

  return {
    pluginStats,
    ...result,
  };
}
