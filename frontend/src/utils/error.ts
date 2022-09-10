import axios from 'axios';
import { NextApiResponse } from 'next';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function apiErrorWrapper(
  res: NextApiResponse,
  callback: () => Promise<void>,
) {
  try {
    await callback();
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : null;
    res.status(status ?? 500).send(getErrorMessage(err));
  }
}
