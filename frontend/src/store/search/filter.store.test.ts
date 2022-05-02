import pluginIndex from '@/fixtures/index.json';
import {
  PluginCategory,
  PluginCategoryHierarchy,
  PluginIndexData,
} from '@/types';

import { SearchFilterStore } from './filter.store';
import { PluginSearchStore } from './search.store';
import { SearchResult } from './search.types';
import { SpdxLicenseData } from './types';

function getResults(...plugins: PluginIndexData[]): SearchResult[] {
  return plugins.map((plugin) => ({
    index: 0,
    matches: {},
    plugin,
  }));
}

const TEST_PLUGIN = pluginIndex[0] as PluginIndexData;

function getVersionResults(...versions: string[]): SearchResult[] {
  const plugins = versions.map((python_version) => ({
    ...TEST_PLUGIN,
    python_version,
  }));

  return getResults(...plugins);
}

function getOperatingSystemResults(
  ...operatingSystems: string[][]
): SearchResult[] {
  const plugins = operatingSystems.map((operating_system) => ({
    ...TEST_PLUGIN,
    operating_system,
  }));

  return getResults(...plugins);
}

function getLicenseResults(...licenses: string[]): SearchResult[] {
  const plugins = licenses.map((license) => ({
    ...TEST_PLUGIN,
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
    ...TEST_PLUGIN,
    category,
    category_hierarchy,
  }));

  return getResults(...plugins);
}

describe('filterResults()', () => {
  describe('filter by python versions', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getVersionResults('>=3.10', '>=3.9');
      const store = new SearchFilterStore();
      const filtered = store.filterResults(results);
      expect(filtered).toEqual(results);
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
        const store = new SearchFilterStore({
          pythonVersions: { 3.9: true },
        });
        const result = store.filterResults(input);
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
      const store = new SearchFilterStore();
      const filtered = store.filterResults(results);
      expect(filtered).toEqual(results);
    });

    it('should allow OS Independent plugins', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );

      const store = new SearchFilterStore({
        operatingSystems: {
          mac: true,
        },
      });
      const filtered = store.filterResults(results);

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
        input: Partial<PluginSearchStore['filters']['operatingSystems']>;
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
        const store = new SearchFilterStore({ operatingSystems: input });
        const filtered = store.filterResults(results);
        expect(filtered).toEqual(output);
      });
    });
  });

  describe('filter by license', () => {
    const results = getLicenseResults('valid', 'invalid');

    it('should allow all plugins when no filters are enabled', () => {
      const store = new SearchFilterStore();
      const filtered = store.filterResults(results);
      expect(filtered).toEqual(results);
    });

    it('should filter plugins with open source licenses', () => {
      const store = new SearchFilterStore(
        {
          license: {
            openSource: true,
          },
        },
        [],
        [{ licenseId: 'valid', isOsiApproved: true } as SpdxLicenseData],
      );
      const filtered = store.filterResults(results);
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
      const store = new SearchFilterStore();
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const store = new SearchFilterStore({
        workflowStep: {
          bar: true,
        },
      });
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual(categoryResults.slice(0, 2));
    });
  });

  describe('filter by image modality', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const store = new SearchFilterStore();
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const store = new SearchFilterStore({
        imageModality: {
          bar: true,
        },
      });
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual([categoryResults[2]]);
    });
  });

  describe('filter by supported data', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const store = new SearchFilterStore();
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual(categoryResults);
    });

    it('should filter plugins with matching workflow steps', () => {
      const store = new SearchFilterStore({
        supportedData: {
          '3d': true,
        },
      });
      const filtered = store.filterResults(categoryResults);
      expect(filtered).toEqual([categoryResults[0], categoryResults[2]]);
    });
  });
});
