import { NextApiRequest, NextApiResponse } from 'next';

export default function healthCheck(
  _: NextApiRequest,
  res: NextApiResponse,
): void {
  res.status(200).json({ status: 'ok' });
}
