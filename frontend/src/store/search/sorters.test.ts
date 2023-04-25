/* eslint-disable jest/expect-expect */

import { isEqual, shuffle as ldshuffle } from 'lodash';
import timezoneMock from 'timezone-mock';
import { Optional } from 'utility-types';

import pluginFixture from '@/fixtures/plugin.json';
import { PluginIndexData } from '@/types';

import { SearchSortType } from './constants';
import { SearchResult } from './search.types';
import { compareDates, sortResults } from './sorters';

function shuffle<T>(array: Array<T>): Array<T> {
  let shuffled: Array<T>;

  // guarantee array is shuffled
  do {
    shuffled = ldshuffle(array);
  } while (isEqual(array, shuffled));

  return shuffled;
}

function sortNewToOld(dates: string[]): string[] {
  return dates.slice().sort(compareDates);
}

describe('compareDates()', () => {
  it('should return 0 when dateA and dateB are the same', () => {
    expect(compareDates('1995-12-17 03:24:00', '1995-12-17T03:24:00')).toBe(0);
  });

  it('should return a negative number when dateA is newer than dateB', () => {
    expect(
      compareDates('2020-01-01 00:00:00', '2019-01-01 00:00:00'),
    ).toBeLessThan(0);
  });

  it('should return a positive number when dateB is newer than dateA', () => {
    expect(
      compareDates('2020-01-01 00:00:00', '2020-01-01 00:00:01'),
    ).toBeGreaterThan(0);
  });

  it('should sort dates from newest to oldest (trivial)', () => {
    const datesSorted = [
      '2020-01-01 00:00:00',
      '2019-02-01 00:00:00',
      '2019-01-02 00:00:00',
      '2019-01-01 01:00:00',
      '2019-01-01 00:01:00',
      '2019-01-01 00:00:01',
      '2019-01-01 00:00:00',
    ];

    const datesShuffled = shuffle(datesSorted);

    expect(datesShuffled).not.toEqual(datesSorted);
    expect(sortNewToOld(datesShuffled)).toEqual(datesSorted);
  });

  it('should sort dates from newest to oldest (complex)', () => {
    const datesSorted = [
      '2028-02-01 15:50:49',
      '2013-08-20 16:17:33',
      '2013-07-26 07:04:39',
      '2012-01-02 17:44:56',
      '2010-06-28 20:01:09',
      '2008-08-08 05:29:52',
      '2004-04-12 20:23:48',
      '2003-06-10 19:46:13',
      '2000-09-24 04:16:24',
      '2000-09-01 08:32:31',
    ];

    const datesShuffled = shuffle(datesSorted);

    expect(datesShuffled).not.toEqual(datesSorted);
    expect(sortNewToOld(shuffle(datesSorted))).toEqual(datesSorted);
  });
});

type ResultEntry = Optional<
  Pick<
    PluginIndexData,
    'name' | 'display_name' | 'release_date' | 'first_released'
  >
>;

function getResults(...results: ResultEntry[]): SearchResult[] {
  return results.map((result, index) => ({
    index,
    matches: {},
    plugin: {
      ...pluginFixture,
      ...result,
    },
  }));
}

function testSortedResults({
  sortType,
  results,
  expected,
}: {
  sortType: SearchSortType;
  results: SearchResult[];
  expected: string[];
}) {
  const sortedResults = sortResults(sortType, results);
  expect(sortedResults.map((result) => result.plugin.name)).toEqual(expected);
}

describe('sortResults()', () => {
  it('should sort by first released date', () => {
    // Use actual Date object
    timezoneMock.unregister();

    testSortedResults({
      results: getResults(
        { name: 'result1', first_released: '01-04-23' },
        { name: 'result2', first_released: '01-01-23' },
        { name: 'result3', first_released: '01-07-23' },
      ),
      sortType: SearchSortType.FirstReleased,
      expected: ['result3', 'result1', 'result2'],
    });
  });

  it('should sort by release date', () => {
    // Use actual Date object
    timezoneMock.unregister();

    testSortedResults({
      results: getResults(
        { name: 'result1', release_date: '01-04-23' },
        { name: 'result2', release_date: '01-01-23' },
        { name: 'result3', release_date: '01-07-23' },
      ),
      sortType: SearchSortType.ReleaseDate,
      expected: ['result3', 'result1', 'result2'],
    });
  });

  it('should sort plugins without display names', () => {
    testSortedResults({
      results: getResults({ name: 'c' }, { name: 'napari-a' }, { name: 'b' }),
      sortType: SearchSortType.PluginName,
      expected: ['napari-a', 'b', 'c'],
    });
  });

  it('should sort plugins with display names', () => {
    testSortedResults({
      results: getResults(
        { name: 'napari-c', display_name: 'c' },
        { name: 'napari-a', display_name: 'a' },
        { name: 'napari-b', display_name: 'b' },
      ),
      sortType: SearchSortType.PluginName,
      expected: ['napari-a', 'napari-b', 'napari-c'],
    });
  });

  it('should sort plugins with and without display names', () => {
    testSortedResults({
      results: getResults(
        { name: 'napari-d' },
        { name: 'napari-a', display_name: 'b' },
        { name: 'napari-c' },
        { name: 'napari-b', display_name: 'a' },
      ),
      sortType: SearchSortType.PluginName,
      expected: ['napari-b', 'napari-a', 'napari-c', 'napari-d'],
    });
  });
});
