import { NextApiRequest, NextApiResponse } from 'next';

import { apiErrorWrapper } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

export default async function getPluginActivity(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  await apiErrorWrapper(res, async () => {
    const plugins = await hubAPI.getPluginActivity(req.query.name as string);
    res.json(plugins);
  });
}
