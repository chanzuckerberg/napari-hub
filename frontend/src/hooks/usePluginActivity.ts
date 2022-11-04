import { AxiosError } from 'axios';
import { useQuery, UseQueryOptions } from 'react-query';

import { DataPoint } from '@/types/stats';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginActivity(
  plugin?: string,
  options?: UseQueryOptions<DataPoint[], AxiosError>,
) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { data: dataPoints = [], ...result } = useQuery<
    DataPoint[],
    AxiosError
  >(
    ['plugin-activity', plugin],
    () => (plugin ? hubAPI.getPluginActivity(plugin) : []),
    {
      enabled: isActivityDashboardEnabled && (options?.enabled ?? true),
      ...options,
    },
  );

  return { dataPoints, ...result };
}
