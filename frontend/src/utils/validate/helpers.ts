/* eslint-disable no-param-reassign */

import { defaultsDeep, get, hasIn, set } from 'lodash';
import { DeepPartial, PickByValue } from 'utility-types';
import { z } from 'zod';

import { DEFAULT_PLUGIN_DATA } from '@/constants/plugin';
import { PluginData, PluginIndexData } from '@/types';

/**
 * Create a schema matches anything and returns a value. Use it with `or`:
 *
 * const schema = zod.number();
 * const tolerant = schema.or(fallback(-1));
 *
 * schema.parse('foo')      // => ZodError
 * tolerant.parse('foo')    // -1
 */
export function fallback<T>(value: T) {
  return z.any().transform(() => value);
}

/**
 * Schema for validating strings. If the value is not a string, then fallback to
 * an empty string.
 */
export const stringSchema = z.string().or(fallback(''));

/**
 * Schema for validating string arrays. If any item within the array is not a
 * string, it'll fallback to an empty string. Similarly, if the array provided
 * is somehow not an array, it'll return an empty array.
 */
export const stringArraySchema = z
  .string()
  .or(fallback(''))
  .array()
  .optional()
  .or(fallback([]));

/**
 * Zod does not export this type, so declaring it here.
 */
type EnumLike = {
  [k: string]: string | number;
  [nu: number]: string;
};

/**
 * Helper for getting a schema representing an array containing values from a
 * TypeScript enum object.
 */
export function getEnumSchemaArray<T extends EnumLike>(enumLike: T) {
  return z
    .nativeEnum(enumLike)
    .or(fallback(''))
    .array()
    .optional()
    .or(fallback([]));
}

/**
 * Returns a sanitizer function for optional strings that can be deleted if the
 * string is empty.
 */
export function getOptionalStringArraySanitizer<
  T extends PluginIndexData | PluginData,
>(key: keyof PickByValue<T, string | undefined>) {
  return (result: T) => {
    if (get(result, key, '') === '') {
      delete result[key];
    }
  };
}

/**
 * Returns sanitizer function that can be used for removing empty strings from
 * the array and deleting the array if it's optional.
 */
export function getStringArraySanitizer<T extends PluginIndexData | PluginData>(
  key: keyof PickByValue<T, string[] | undefined>,
  {
    optional,
  }: {
    optional?: boolean;
  } = {},
) {
  return (result: T) => {
    const values = (get(result, key, []) as string[] | undefined)?.filter(
      Boolean,
    );

    if (values?.length === 0 && optional) {
      delete result[key];
    } else {
      set(result, key, values);
    }
  };
}

/**
 * Type for declaring a map of functions that are used to sanitize a particular object prop.
 */
export type SanitizerMap<T> = Partial<Record<keyof T, (result: T) => void>>;

function getPluginData(data: DeepPartial<PluginData>) {
  return defaultsDeep(data, DEFAULT_PLUGIN_DATA) as PluginData;
}

/**
 * Symbol for testing props that should be deleted.
 */
export const DELETED = Symbol('deleted');

/**
 * Creates new test cases for validating plugin data against valid and invalid data.
 */
export function createValidatePluginTest<T, K extends keyof T = keyof T>({
  key,
  validData,
  invalidData,
  expectedInvalidDataResult,
  validatePlugin,
}: {
  key: K;
  validData: DeepPartial<T[K]>;
  invalidData: DeepPartial<T[K]>;
  expectedInvalidDataResult: DeepPartial<T[K]> | typeof DELETED;
  validatePlugin: (plugin: T) => T;
}) {
  // eslint-disable-next-line jest/valid-title
  describe(key as string, () => {
    it('should return data if valid', () => {
      const plugin = getPluginData({
        [key]: validData,
      });

      const result = validatePlugin(plugin as unknown as T);
      expect(result[key]).toEqual(get(plugin, key));
    });

    it('should return defaults if invalid', () => {
      const plugin = getPluginData({
        [key]: invalidData,
      });

      const result = validatePlugin(plugin as unknown as T);
      if (expectedInvalidDataResult === DELETED) {
        expect(hasIn(result, key)).toBe(false);
      } else {
        expect(result[key]).toEqual(expectedInvalidDataResult);
      }
    });
  });
}
