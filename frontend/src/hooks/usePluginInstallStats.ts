import { AxiosError } from 'axios';
import { useQuery, UseQueryOptions } from 'react-query';

import { PluginInstallStats } from '@/types/stats';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginInstallStats(
  plugin?: string,
  options?: UseQueryOptions<PluginInstallStats | null, AxiosError>,
) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { data: pluginStats, ...result } = useQuery<
    PluginInstallStats | null,
    AxiosError
  >(
    ['plugin-stats', plugin],
    () => (plugin ? hubAPI.getPluginInstallStats(plugin) : null),
    {
      enabled: isActivityDashboardEnabled && (options?.enabled ?? true),
      ...options,
    },
  );

  return {
    pluginStats,
    ...result,
  };
}
