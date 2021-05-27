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
});
