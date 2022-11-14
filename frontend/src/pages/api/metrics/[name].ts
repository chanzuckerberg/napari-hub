import { NextApiRequest, NextApiResponse } from 'next';

import { apiErrorWrapper } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

export default async function getPluginMetrics(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  await apiErrorWrapper(res, async () => {
    const metrics = await hubAPI.getPluginMetrics(req.query.name as string);
    res.json(metrics);
  });
}
