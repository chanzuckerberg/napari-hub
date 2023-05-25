/* eslint-disable no-param-reassign */

import { hasIn, set } from 'lodash';
import { z } from 'zod';

import { DEFAULT_PLUGIN_DATA } from '@/constants/plugin';
import { HubDimension, PluginData } from '@/types';

import {
  fallback,
  getOptionalStringArraySanitizer,
  getStringArraySanitizer,
  SanitizerMap,
  stringArraySchema,
  stringSchema,
} from './helpers';
import { pluginBaseSchema } from './schemas';
import { PLUGIN_INDEX_DATA_SANITIZERS } from './validatePluginIndexData';

const hierarchrySchema = z
  .string()
  .or(fallback(''))
  .array()
  .or(fallback([]))
  .array()
  .or(fallback([]))
  .optional();

const pluginCategoryHierarchySchema = z.object({
  'Workflow step': hierarchrySchema,
  'Supported data': hierarchrySchema,
  'Image modality': hierarchrySchema,
});

const pluginCitationSchema = z.object({
  citation: z.string(),
  RIS: z.string(),
  BibTex: z.string(),
  APA: z.string(),
});

const pluginDataSchema = pluginBaseSchema
  .extend({
    action_repository: z.string().url().or(fallback('')),
    category_hierarchy: pluginCategoryHierarchySchema
      .optional()
      .or(fallback(null)),
    citations: pluginCitationSchema.optional().or(fallback(undefined)),
    code_repository: stringSchema,
    documentation: stringSchema,
    project_site: stringSchema,
    release_date: stringSchema,
    report_issues: stringSchema,
    requirements: stringArraySchema,
    support: stringSchema,
    twitter: stringSchema,
  })
  .or(fallback(DEFAULT_PLUGIN_DATA));

const SANITIZERS: SanitizerMap<PluginData> = {
  ...(PLUGIN_INDEX_DATA_SANITIZERS as SanitizerMap<PluginData>),

  category_hierarchy(result) {
    if (!result.category_hierarchy) return;

    const keys = Object.keys(result.category_hierarchy) as HubDimension[];

    keys.forEach((dimension) =>
      set(
        result,
        ['category_hierarchy', dimension],
        result.category_hierarchy?.[dimension]
          ?.map((hierarchy) => hierarchy.filter(Boolean))
          .filter((hierarchry) => hierarchry.length > 0) ?? [],
      ),
    );
  },

  citations(result) {
    if (hasIn(result, 'citations') && result.citations === undefined) {
      delete result.citations;
    }
  },

  action_repository: getOptionalStringArraySanitizer('action_repository'),
  requirements: getStringArraySanitizer('requirements'),
};

export function validatePluginData(plugin: PluginData): PluginData {
  const result = pluginDataSchema.parse(plugin) as PluginData;

  for (const key of Object.keys(result) as Array<keyof PluginData>) {
    const sanitize = SANITIZERS[key];

    if (sanitize) {
      sanitize(result);
    }
  }

  return result;
}
