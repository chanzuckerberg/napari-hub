import { useQuery } from 'react-query';

import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginActivity(plugin?: string) {
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const { data: dataPoints = [], ...result } = useQuery(
    ['plugin-activity', plugin],
    () => (plugin ? hubAPI.getPluginActivity(plugin) : []),
    { enabled: isActivityDashboardEnabled },
  );

  return { dataPoints, ...result };
}
