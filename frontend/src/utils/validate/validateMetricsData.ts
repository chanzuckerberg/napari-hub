/* eslint-disable no-param-reassign */

import { z } from 'zod';

import { PluginMetrics } from '@/types/metrics';

const maintenanceSchema = z.object({
  stats: z.object({
    latest_commit_timestamp: z.string().nullable(),
  }),
});

const usageSchema = z.object({
  stats: z.object({
    installs_in_last_30_days: z.number(),
    total_installs: z.number(),
  }),
  timeline: z.array(
    z.object({
      installs: z.number(),
      timestamp: z.number(),
    }),
  ),
});

const metricsSchema = z.object({
  maintenance: maintenanceSchema,
  usage: usageSchema,
});

export function validateMetricsData(metrics: PluginMetrics): PluginMetrics {
  return metricsSchema.parse(metrics) as PluginMetrics;
}
