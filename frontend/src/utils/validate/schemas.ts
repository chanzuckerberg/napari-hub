import { z } from 'zod';

import { PluginType, PluginWriterSaveLayer } from '@/types';

import {
  fallback,
  getEnumSchemaArray,
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

export const pluginBaseSchema = z.object({
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
  plugin_types: getEnumSchemaArray(PluginType),
  python_version: stringSchema,
  reader_file_extensions: stringArraySchema,
  release_date: stringSchema,
  summary: stringSchema,
  version: stringSchema,
  writer_file_extensions: stringArraySchema,
  writer_save_layers: getEnumSchemaArray(PluginWriterSaveLayer),
});
