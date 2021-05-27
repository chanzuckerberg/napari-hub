import pluginIndex from '@/fixtures/index.json';
import { PluginIndexData } from '@/types';

import { FilterFormState } from './filter.types';
import { getDefaultState } from './filter.utils';
import { filterResults } from './filters';
import { SearchResult } from './search.types';

function getResults(...plugins: PluginIndexData[]): SearchResult[] {
  return plugins.map((plugin) => ({
    index: 0,
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

describe('filterResults()', () => {
  let state: FilterFormState;

  beforeEach(() => {
    state = getDefaultState();
  });

  describe('filter by python versions', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getVersionResults('>=3.10', '>=3.9');
      expect(filterResults(results, state)).toEqual(results);
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

      state.pythonVersions['3.9'] = true;

      testCases.forEach(({ input, output }) =>
        expect(filterResults(input, state)).toEqual(output),
      );
    });
  });

  describe('filter by operating systems', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );
      expect(filterResults(results, state)).toEqual(results);
    });

    it('should allow OS Independent plugins', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );
      state.operatingSystems.mac = true;
      expect(filterResults(results, state)).toEqual(
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

      const testCases = [
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
        state = getDefaultState();
        Object.assign(state.operatingSystems, input);
        expect(filterResults(results, state)).toEqual(output);
      });
    });
  });
});
