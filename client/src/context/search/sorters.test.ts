import { compareDates } from './sorters';

function shuffle<T>(array: Array<T>): Array<T> {
  // https://flaviocopes.com/how-to-shuffle-array-javascript/
  const shuffled = array.slice();

  do {
    shuffled.sort(() => Math.random() - 0.5);
  } while (shuffled === array);

  return shuffled;
}

function sortNewToOld(dates: string[]): string[] {
  return dates.slice().sort(compareDates);
}

describe('compareDates()', () => {
  it('should return 0 when dateA and dateB are the same', () => {
    expect(compareDates('1995-12-17 03:24:00', '1995-12-17T03:24:00')).toBe(0);
  });

  it('should return a positive number when dateA is newer than dateB', () => {
    expect(
      compareDates('2020-01-01 00:00:00', '2019-01-01 00:00:00'),
    ).toBeGreaterThan(0);
  });

  it('should return a negative number when dateB is newer than dateA', () => {
    expect(
      compareDates('2020-01-01 00:00:00', '2020-01-01 00:00:01'),
    ).toBeLessThan(0);
  });

  it('should sort dates from newest to oldest (trivial)', () => {
    const datesSorted = [
      '2019-01-01 00:00:00',
      '2019-01-01 00:00:01',
      '2019-01-01 00:01:00',
      '2019-01-01 01:00:00',
      '2019-01-02 00:00:00',
      '2019-02-01 00:00:00',
      '2020-01-01 00:00:00',
    ];

    const datesShuffled = shuffle(datesSorted);

    expect(datesShuffled).not.toEqual(datesSorted);
    expect(sortNewToOld(datesShuffled)).toEqual(datesSorted);
  });

  it('should sort dates from newest to oldest (complex)', () => {
    const datesSorted = [
      '2000-09-01 08:32:31',
      '2000-09-24 04:16:24',
      '2003-06-10 19:46:13',
      '2004-04-12 20:23:48',
      '2008-08-08 05:29:52',
      '2010-06-28 20:01:09',
      '2012-01-02 17:44:56',
      '2013-07-26 07:04:39',
      '2013-08-20 16:17:33',
      '2028-02-01 15:50:49',
    ];

    const datesShuffled = shuffle(datesSorted);

    expect(datesShuffled).not.toEqual(datesSorted);
    expect(sortNewToOld(shuffle(datesSorted))).toEqual(datesSorted);
  });
});
