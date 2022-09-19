import { NextApiRequest, NextApiResponse } from 'next';

import { apiErrorWrapper } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

export default async function getPluginInstallStats(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  await apiErrorWrapper(res, async () => {
    const plugins = await hubAPI.getPluginInstallStats(
      req.query.name as string,
    );
    res.json(plugins);
  });
}
