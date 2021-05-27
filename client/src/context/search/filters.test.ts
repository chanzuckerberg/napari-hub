import { renderHook } from '@testing-library/react-hooks';

import { useSpdx } from '@/context/spdx';
import pluginIndex from '@/fixtures/index.json';
import { PluginIndexData } from '@/types';

import { FilterFormState } from './filter.types';
import { getDefaultState } from './filter.utils';
import { useFilterResults } from './filters';
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

describe('filterResults()', () => {
  let state: FilterFormState;

  beforeEach(() => {
    state = getDefaultState();
    (useSpdx as jest.Mock).mockClear();
  });

  describe('filter by python versions', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getVersionResults('>=3.10', '>=3.9');
      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(results);
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

      testCases.forEach(({ input, output }) => {
        const { result } = renderHook(() => useFilterResults(input, state));
        expect(result.current).toEqual(output);
      });
    });
  });

  describe('filter by operating systems', () => {
    it('should allow all plugins when no filters are enabled', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );
      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(results);
    });

    it('should allow OS Independent plugins', () => {
      const results = getOperatingSystemResults(
        ['Operating System :: OS Independent'],
        ['Operating System :: POSIX :: Linux'],
      );
      state.operatingSystems.mac = true;

      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(
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

        const { result } = renderHook(() => useFilterResults(results, state));
        expect(result.current).toEqual(output);
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
      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(results);
    });

    it('should filter stable plugins', () => {
      state.developmentStatus.onlyStablePlugins = true;
      const expected = getDevStatusResults(
        ['Development Status :: 5 - Production/Stable'],
        ['Development Status :: 6 - Mature'],
      );

      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(expected);
    });
  });

  describe('filter by license', () => {
    const results = getLicenseResults('valid', 'invalid');

    beforeEach(() => {});

    it('should allow all plugins when no filters are enabled', () => {
      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(results);
    });

    it('should filter plugins with open source licenses', () => {
      type F = typeof useSpdx;
      type P = Parameters<F>;
      type R = ReturnType<F>;

      (useSpdx as jest.Mock<R, P>).mockReturnValueOnce({
        isOSIApproved: jest
          .fn()
          .mockImplementationOnce((license: string) => license === 'valid'),
      });

      state.license.onlyOpenSourcePlugins = true;

      const { result } = renderHook(() => useFilterResults(results, state));
      expect(result.current).toEqual(getLicenseResults('valid'));
    });
  });
});
