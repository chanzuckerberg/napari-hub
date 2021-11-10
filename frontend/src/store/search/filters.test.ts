import { defaultsDeep } from 'lodash';
import { DeepPartial } from 'utility-types';

import pluginIndex from '@/fixtures/index.json';
import {
  DeriveGet,
  PluginCategory,
  PluginCategoryHierarchy,
  PluginIndexData,
} from '@/types';

import { filterResults } from './filters';
import { DEFAULT_STATE, SearchFormStore } from './form.store';
import { SearchResult } from './search.types';

function getResults(...plugins: PluginIndexData[]): SearchResult[] {
  return plugins.map((plugin) => ({
    index: 0,
    matches: {},
    plugin,
  }));
}

function getVersionResults(...versions: string[]): SearchResult[] {
  const plugins = versions.map((python_version) => ({
    ...pluginIndex[0],
    python_version,
  }));

  return getResults(...plugins);
}

function getOperatingSystemResults(
  ...operatingSystems: string[][]
): SearchResult[] {
  const plugins = operatingSystems.map((operating_system) => ({
    ...pluginIndex[0],
    operating_system,
  }));

  return getResults(...plugins);
}

function getDevStatusResults(...devStatuses: string[][]): SearchResult[] {
  const plugins = devStatuses.map((development_status) => ({
    ...pluginIndex[0],
    development_status,
  }));

  return getResults(...plugins);
}

function getLicenseResults(...licenses: string[]): SearchResult[] {
  const plugins = licenses.map((license) => ({
    ...pluginIndex[0],
    license,
  }));

  return getResults(...plugins);
}

interface CategoryResultData {
  category?: PluginCategory;
  category_hierarchy?: PluginCategoryHierarchy;
}

function getCategoryResults(
  ...categoryData: CategoryResultData[]
): SearchResult[] {
  const plugins = categoryData.map(({ category, category_hierarchy }) => ({
    ...pluginIndex[0],
    category,
    category_hierarchy,
  }));

  return getResults(...plugins);
}

function createMockFilterGet(
  filters: DeepPartial<SearchFormStore['filters']> = {},
) {
  return jest.fn(() =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    defaultsDeep({ filters }, DEFAULT_STATE),
  ) as unknown as DeriveGet;
}

describe('filterResults()', () => {
  describe('filter by python versions', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getVersionResults('>=3.10', '>=3.9');
      expect(filterResults(createMockFilterGet(), results)).toEqual(results);
    });

    it("should filter plugins that don't match an exact version", () => {
      const testCases = [
        {
          input: getVersionResults('>=3.10', '==3.9'),
          output: getVersionResults('==3.9'),
        },
        {
          input: getVersionResults('>=3.10', '>=3.9'),
          output: getVersionResults('>=3.9'),
        },
        {
          input: getVersionResults('>=3.10', '>3.8'),
          output: getVersionResults('>3.8'),
        },
        {
          input: getVersionResults('>=3.10', '<3.10'),
          output: getVersionResults('<3.10'),
        },
        {
          input: getVersionResults('>=3.10', '<3.10,!=3.9'),
          output: [],
        },
      ];

      testCases.forEach(({ input, output }) => {
        const result = filterResults(
          createMockFilterGet({
            pythonVersions: {
              3.9: true,
            },
          }),
          input,
        );
        expect(result).toEqual(output);
      });
    });
  });

  describe('filter by operating systems', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );
      const filtered = filterResults(createMockFilterGet(), results);
      expect(filtered).toEqual(results);
    });

    it('should allow OS Independent plugins', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );

      const filtered = filterResults(
        createMockFilterGet({
          operatingSystems: {
            mac: true,
          },
        }),
        results,
      );

      expect(filtered).toEqual(
        getOperatingSystemResults(['Operating System :: OS Independent']),
      );
    });

    it('should filter operating systems', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: Microsoft :: Windows :: Windows 10'],
        ['Environment :: MacOS X'],
        ['Operating System :: POSIX :: Linux'],
        ['Environment :: MacOS X', 'Operating System :: POSIX :: Linux'],
      );

      interface TestCase {
        input: Partial<SearchFormStore['filters']['operatingSystems']>;
        output: SearchResult[];
      }

      const testCases: TestCase[] = [
        {
          input: { mac: true },
          output: getOperatingSystemResults(
            ['Environment :: MacOS X'],
            ['Environment :: MacOS X', 'Operating System :: POSIX :: Linux'],
          ),
        },

        {
          input: { linux: true },
          output: getOperatingSystemResults(
            ['Operating System :: POSIX :: Linux'],
            ['Environment :: MacOS X', 'Operating System :: POSIX :: Linux'],
          ),
        },

        {
          input: { windows: true },
          output: getOperatingSystemResults([
            'Operating System :: Microsoft :: Windows :: Windows 10',
          ]),
        },
      ];

      testCases.forEach(({ input, output }) => {
        const filtered = filterResults(
          createMockFilterGet({ operatingSystems: input }),
          results,
        );
        expect(filtered).toEqual(output);
      });
    });
  });

  describe('filter by development status', () => {
    const results = getDevStatusResults(
      ['Development Status :: 1 - Planning'],
      ['Development Status :: 2 - Pre-Alpha'],
      ['Development Status :: 5 - Production/Stable'],
      ['Development Status :: 6 - Mature'],
      ['Development Status :: 7 - Inactive'],
    );

    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(createMockFilterGet(), results);
      expect(filtered).toEqual(results);
    });

    it('should filter stable plugins', () => {
      const expected = getDevStatusResults(
        ['Development Status :: 5 - Production/Stable'],
        ['Development Status :: 6 - Mature'],
      );

      const filtered = filterResults(
        createMockFilterGet({
          devStatus: {
            stable: true,
          },
        }),
        results,
      );
      expect(filtered).toEqual(expected);
    });
  });

  describe('filter by license', () => {
    const results = getLicenseResults('valid', 'invalid');

    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(createMockFilterGet(), results);
      expect(filtered).toEqual(results);
    });

    it('should filter plugins with open source licenses', () => {
      const filtered = filterResults(
        createMockFilterGet({
          license: {
            openSource: true,
            osiApprovedLicenseSet: new Set(['valid']),
          },
        }),
        results,
      );
      expect(filtered).toEqual(getLicenseResults('valid'));
    });
  });

  const categoryResults = getCategoryResults(
    {
      category: {
        'Supported data': ['2d', '3d'],
        'Workflow step': ['foo', 'bar'],
      },
    },
    {
      category: {
        'Workflow step': ['bar'],
      },
    },
    {
      category: {
        'Image modality': ['foo', 'bar'],
        'Supported data': ['3d'],
      },
    },
  );

  describe('filter by workflow step', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(createMockFilterGet(), categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const filtered = filterResults(
        createMockFilterGet({
          workflowStep: {
            bar: true,
          },
        }),
        categoryResults,
      );
      expect(filtered).toEqual(categoryResults.slice(0, 2));
    });
  });

  describe('filter by image modality', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(createMockFilterGet(), categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const filtered = filterResults(
        createMockFilterGet({
          imageModality: {
            bar: true,
          },
        }),
        categoryResults,
      );
      expect(filtered).toEqual(categoryResults.slice(2, 3));
    });
  });

  describe('filter by supported data', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(createMockFilterGet(), categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const filtered = filterResults(
        createMockFilterGet({
          supportedData: {
            '3d': true,
          },
        }),
        categoryResults,
      );
      expect(filtered).toEqual([categoryResults[0], categoryResults[2]]);
    });
  });
});
