import { NextApiRequest, NextApiResponse } from 'next';

import { apiErrorWrapper } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

export default async function getActivityPlugins(
  _: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  await apiErrorWrapper(res, async () => {
    const plugins = await hubAPI.getPluginsWithActivities();
    res.json(plugins);
  });
}
