/* eslint-disable no-param-reassign */

import { z } from 'zod';

import { CollectionIndexData } from '@/types/collections';

import { stringSchema } from './helpers';

const collectionInstitutionSchema = z.object({
  institution: z.string(),
  website: z.string(),
});

const nullableString = z.string().nullable().optional();

const collectionLinkSchema = z
  .object({
    orcid: z.string(),
    twitter: nullableString,
    github: nullableString,
    website: nullableString,
  })
  // Remove links with null values
  .transform((links) =>
    Object.fromEntries(
      Object.entries(links).filter(([, link]) => link !== null),
    ),
  );

const collectionCuratorSchema = z.object({
  name: z.string(),
  title: z.string(),
  affiliation: collectionInstitutionSchema,
  links: collectionLinkSchema.optional(),
});

export const collectionIndexDataSchema = z.object({
  title: stringSchema,
  cover_image: z.string().url(),
  thumb_image: z.string().url(),
  summary: stringSchema,
  curator: collectionCuratorSchema,
  symbol: stringSchema,
});

export function validateCollectionIndexData(
  collection: CollectionIndexData,
): CollectionIndexData {
  return collectionIndexDataSchema.parse(collection) as CollectionIndexData;
}
