/* eslint-disable no-param-reassign */

import { defaultsDeep, get, hasIn } from 'lodash';
import { DeepPartial } from 'utility-types';

import { DEFAULT_PLUGIN_DATA } from '@/constants/plugin';
import { PluginData } from '@/types';

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
