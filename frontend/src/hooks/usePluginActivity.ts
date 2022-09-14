import { useQuery } from 'react-query';

import { DataPoint, RawDataPoint } from '@/types/stats';
import { hubAPI } from '@/utils/HubAPIClient';

export function usePluginActivity(plugin?: string) {
  const { data: dataPoints = [], ...result } = useQuery(
    ['plugin-activity', plugin],
    async () => {
      const points: RawDataPoint[] = await (plugin
        ? hubAPI.getPluginActivity(plugin)
        : []);

      return points.map((point) => ({ x: point[0], y: point[1] } as DataPoint));
    },
  );

  return { dataPoints, ...result };
}
