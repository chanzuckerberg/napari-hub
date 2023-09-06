import { z } from 'zod';

const CloudwatchRumConfigSchema = z.object({
  app_id: z.string(),
  app_name: z.string(),
  identity_pool_id: z.string(),
  role_arn: z.string(),
});

export type CloudwatchRumConfig = z.infer<typeof CloudwatchRumConfigSchema>;

export function getAwsRumConfig(): CloudwatchRumConfig | null {
  try {
    const config = {
      app_id: process.env.CLOUDWATCH_RUM_APP_ID,
      app_name: process.env.CLOUDWATCH_RUM_APP_NAME,
      identity_pool_id: process.env.CLOUDWATCH_RUM_IDENTITY_POOL_ID,
      role_arn: process.env.CLOUDWATCH_RUM_ROLE_ARN,
    };

    return CloudwatchRumConfigSchema.parse(config);
  } catch (_) {
    // ignore errors when unable to get AWS RUM config
  }

  return null;
}
