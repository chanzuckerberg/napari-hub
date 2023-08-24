import { NextApiRequest, NextApiResponse } from 'next';

import { LogEntry } from '@/types/logging';

interface RequestBody {
  logs: LogEntry[];
}

export default function logs(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method !== 'POST') {
    res
      .status(400)
      .json({ status: 'error', error: 'Should be called with POST' });

    return;
  }

  const { logs: entries } = req.body as RequestBody;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, no-console
  entries.forEach((entry) => console[entry.level](...entry.messages));

  res.status(200).json({ status: 'ok' });
}
