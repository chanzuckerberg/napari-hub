import { z } from 'zod';

/**
 * Get human friendly version of zod error message that describes what
 * properties are failing and what types are expected.
 */
export function getZodErrorMessage(error: z.ZodError) {
  return [
    'Received invalid data:',
    ...error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`,
    ),
  ].join('\n');
}
