import { AxiosError } from 'axios';
import { useQuery, UseQueryOptions } from 'react-query';

import { PluginMetrics } from '@/types/metrics';
import { Logger } from '@/utils';
import { getErrorMessage } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

const logger = new Logger('usePluginMetrics');

export function usePluginMetrics(
  plugin?: string,
  options?: UseQueryOptions<PluginMetrics | undefined, AxiosError>,
) {
  const enabled = !!plugin && (options?.enabled ?? true);

  return useQuery<PluginMetrics | undefined, AxiosError>(
    ['plugin-activity', plugin],
    () => (plugin ? hubAPI.getPluginMetrics(plugin) : undefined),
    {
      enabled,
      onError(err) {
        options?.onError?.(err);

        logger.error({
          message: 'Failed to fetch plugin metrics',
          error: getErrorMessage(err),
        });
      },
      ...options,
    },
  );
}
