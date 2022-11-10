import { AxiosError } from 'axios';
import { useQuery, UseQueryOptions } from 'react-query';

import { PluginRecentInstallStats } from '@/types/stats';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginRecentInstallStats(
  plugin?: string,
  options?: UseQueryOptions<PluginRecentInstallStats | null, AxiosError>,
) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { data: pluginRecentStats, ...result } = useQuery<
    PluginRecentInstallStats | null,
    AxiosError
  >(
    ['plugin-recent-stats', plugin],
    () => (plugin ? hubAPI.getPluginRecentInstallStats(plugin) : null),
    {
      enabled: isActivityDashboardEnabled && (options?.enabled ?? true),
      ...options,
    },
  );

  return {
    pluginRecentStats,
    ...result,
  };
}
