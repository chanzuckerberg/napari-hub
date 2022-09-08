import { useQuery } from 'react-query';

import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginActivity(plugin?: string) {
  const { data: dataPoints = [], ...result } = useQuery(
    ['plugin-activity', plugin],
    () => (plugin ? hubAPI.getPluginActivity(plugin) : []),
  );

  return { dataPoints, ...result };
}
