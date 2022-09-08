import { useQuery } from 'react-query';

import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginInstallStats(plugin?: string) {
  const { data: pluginStats, ...result } = useQuery(
    ['plugin-stats', plugin],
    () => (plugin ? hubAPI.getPluginInstallStats(plugin) : null),
  );

  return {
    pluginStats,
    ...result,
  };
}
