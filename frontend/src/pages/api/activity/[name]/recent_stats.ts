import { NextApiRequest, NextApiResponse } from 'next';

import { apiErrorWrapper } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';

export default async function getPluginRecentInstallStats(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  await apiErrorWrapper(res, async () => {
    const stats = await hubAPI.getPluginRecentInstallStats(
      req.query.name as string,
    );
    res.json(stats);
  });
}
