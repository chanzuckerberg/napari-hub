/* eslint-disable no-param-reassign */

import { pickBy } from 'lodash';
import { z } from 'zod';

import { DEFAULT_PLUGIN_DATA } from '@/constants/plugin';
import { HubDimension, PluginAuthor, PluginIndexData } from '@/types';

import {
  fallback,
  getOptionalStringArraySanitizer,
  getStringArraySanitizer,
  SanitizerMap,
} from './helpers';
import { pluginBaseSchema } from './schemas';

export const pluginIndexDataSchema = pluginBaseSchema.extend({
  total_installs: z.number(),
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
