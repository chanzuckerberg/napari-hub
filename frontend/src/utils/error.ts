import axios from 'axios';
import { z } from 'zod';

/**
 * Get human friendly version of zod error message that describes what
 * properties are failing and what types are expected.
 */
function getZodErrorMessage(error: z.ZodError) {
  return [
    'Received invalid data:',
    ...error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`,
    ),
  ].join('\n');
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof z.ZodError) {
    return getZodErrorMessage(error);
  }

  return String(error);
}
