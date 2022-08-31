/* eslint-disable no-param-reassign */

import { pickBy } from 'lodash';
import { z } from 'zod';

import { DEFAULT_PLUGIN_DATA } from '@/constants/plugin';
import {
  HubDimension,
  PluginAuthor,
  PluginIndexData,
  PluginType,
  PluginWriterSaveLayer,
} from '@/types';

import {
  fallback,
  getEnumSchemaArray,
  getOptionalStringArraySanitizer,
  getStringArraySanitizer,
  SanitizerMap,
  stringArraySchema,
  stringSchema,
} from './helpers';

export const pluginAuthorSchema = z.object({
  name: z.string().min(1).or(fallback('')),
  email: z.string().email().optional().or(fallback('')),
  orcid: z.string().min(1).optional().or(fallback('')),
});

const pluginCategorySchema = z.object({
  'Workflow step': stringArraySchema,
  'Supported data': stringArraySchema,
  'Image modality': stringArraySchema,
});

export const pluginIndexDataSchema = z.object({
  authors: pluginAuthorSchema.array().or(fallback([])),
  category: pluginCategorySchema.optional(),
  description_content_type: stringSchema,
  description_text: stringSchema,
  description: stringSchema,
  development_status: stringArraySchema,
  display_name: stringSchema.optional(),
  first_released: stringSchema,
  license: stringSchema,
  name: stringSchema,
  operating_system: stringArraySchema,
  python_version: stringSchema,
  release_date: stringSchema,
  summary: stringSchema,
  version: stringSchema,
  plugin_types: getEnumSchemaArray(PluginType),
  reader_file_extensions: stringArraySchema,
  writer_file_extensions: stringArraySchema,
  writer_save_layers: getEnumSchemaArray(PluginWriterSaveLayer),
});

export const PLUGIN_INDEX_DATA_SANITIZERS: SanitizerMap<PluginIndexData> = {
  authors(result) {
    result.authors = result.authors
      .filter((author) => author.name !== '')
      .map((author) => pickBy(author, Boolean)) as PluginAuthor[];
  },

  category(result) {
    if (!result.category) return;

    for (const key of Object.keys(result.category) as HubDimension[]) {
      const values = result.category[key]?.filter(Boolean);

      if (values?.length === 0) {
        delete result.category[key];
      } else {
        result.category[key] = values;
      }
    }
  },

  display_name: getOptionalStringArraySanitizer('display_name'),
  development_status: getStringArraySanitizer('development_status'),
  operating_system: getStringArraySanitizer('operating_system'),
  plugin_types: getStringArraySanitizer('plugin_types', { optional: true }),
  reader_file_extensions: getStringArraySanitizer('reader_file_extensions', {
    optional: true,
  }),
  writer_file_extensions: getStringArraySanitizer('writer_file_extensions', {
    optional: true,
  }),
  writer_save_layers: getStringArraySanitizer('writer_save_layers', {
    optional: true,
  }),
};

export function validatePluginIndexData(
  plugin: PluginIndexData,
): PluginIndexData {
  const result = pluginIndexDataSchema
    .or(fallback(DEFAULT_PLUGIN_DATA))
    .parse(plugin) as PluginIndexData;

  for (const key of Object.keys(result) as Array<keyof PluginIndexData>) {
    const sanitize = PLUGIN_INDEX_DATA_SANITIZERS[key];

    if (sanitize) {
      sanitize(result);
    }
  }

  return result;
}
