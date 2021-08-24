import { Getter, WritableAtom } from 'jotai';

import pluginIndex from '@/fixtures/index.json';
import { PluginIndexData } from '@/types';

import { osiApprovedLicenseSetState } from '../spdx';
import {
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterOnlyStablePluginsState,
  filterPython39State,
  FilterStateType,
  filterWindowsState,
} from './filter.state';
import { filterResults } from './filters';
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

function createMockFilterGet(...states: FilterStateType[]) {
  return (jest.fn((state: FilterStateType) =>
    states.includes(state),
  ) as unknown) as Getter;
}

describe('filterResults()', () => {
  describe('filter by python versions', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getVersionResults('>=3.10', '>=3.9');
      expect(filterResults(jest.fn(), results)).toEqual(results);
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
          createMockFilterGet(filterPython39State),
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
      const filtered = filterResults(jest.fn(), results);
      expect(filtered).toEqual(results);
    });

    it('should allow OS Independent plugins', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );

      const filtered = filterResults(
        createMockFilterGet(filterMacState),
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

      const testCases = [
        {
          input: filterMacState,
          output: getOperatingSystemResults(
            ['Environment :: MacOS X'],
            ['Environment :: MacOS X', 'Operating System :: POSIX :: Linux'],
          ),
        },

        {
          input: filterLinuxState,
          output: getOperatingSystemResults(
            ['Operating System :: POSIX :: Linux'],
            ['Environment :: MacOS X', 'Operating System :: POSIX :: Linux'],
          ),
        },

        {
          input: filterWindowsState,
          output: getOperatingSystemResults([
            'Operating System :: Microsoft :: Windows :: Windows 10',
          ]),
        },
      ];

      testCases.forEach(({ input, output }) => {
        const filtered = filterResults(createMockFilterGet(input), results);
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
      const filtered = filterResults(jest.fn(), results);
      expect(filtered).toEqual(results);
    });

    it('should filter stable plugins', () => {
      const expected = getDevStatusResults(
        ['Development Status :: 5 - Production/Stable'],
        ['Development Status :: 6 - Mature'],
      );

      const filtered = filterResults(
        createMockFilterGet(filterOnlyStablePluginsState),
        results,
      );
      expect(filtered).toEqual(expected);
    });
  });

  describe('filter by license', () => {
    const results = getLicenseResults('valid', 'invalid');

    it('should allow all plugins when no filters are enabled', () => {
      const filtered = filterResults(jest.fn(), results);
      expect(filtered).toEqual(results);
    });

    it('should filter plugins with open source licenses', () => {
      const mockFilterGet = createMockFilterGet(
        filterOnlyOpenSourcePluginsState,
      );
      const mockGet = jest.fn((state: WritableAtom<unknown, unknown>) => {
        if (state === osiApprovedLicenseSetState) {
          return new Set(['valid']);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mockFilterGet(state);
      }) as unknown;

      const filtered = filterResults(mockGet as Getter, results);
      expect(filtered).toEqual(getLicenseResults('valid'));
    });
  });
});
