/* eslint-disable no-param-reassign */

import { z } from 'zod';

import { CollectionData, CollectionVisibility } from '@/types/collections';

import { collectionIndexDataSchema } from './validateCollectionIndexData';
import { pluginAuthorSchema } from './validatePluginIndexData';

const collectionPluginSchema = z.object({
  name: z.string(),
  summary: z.string(),
  display_name: z.string().optional(),
  authors: pluginAuthorSchema.array(),
  comment: z.string().optional(),
});

export const collectionSchema = collectionIndexDataSchema.extend({
  description: z.string(),
  updated_date: z.string(),
  plugins: collectionPluginSchema.array(),
  visibility: z.nativeEnum(CollectionVisibility).optional(),
});

export function validateCollectionData(
  collection: CollectionData,
): CollectionData {
  return collectionSchema.parse(collection) as CollectionData;
}
