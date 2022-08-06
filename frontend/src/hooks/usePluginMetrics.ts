import { AxiosError } from 'axios';
import { useQuery, UseQueryOptions } from 'react-query';

import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { PluginMetrics } from '@/types/stats';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginMetrics(
  plugin?: string,
  options?: UseQueryOptions<PluginMetrics | undefined, AxiosError>,
) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const enabled =
    isActivityDashboardEnabled && !!plugin && (options?.enabled ?? true);

  return useQuery<PluginMetrics | undefined, AxiosError>(
    ['plugin-activity', plugin],
    () => (plugin ? hubAPI.getPluginMetrics(plugin) : undefined),
    {
      enabled,
      ...options,
    },
  );
}
