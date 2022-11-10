/* eslint-disable jest/expect-expect */

import dayjs from 'dayjs';
import timezoneMock from 'timezone-mock';

import { DateBucketType, useDateBucketType } from './useFormattedDuration';

interface TestCase {
  now: string;
  date: string;
}

function testUseDateBucketType(
  dateBucketType: DateBucketType,
  testCases: TestCase[],
) {
  testCases.forEach((testCase) => {
    expect(
      useDateBucketType(dayjs(testCase.date), dayjs(testCase.now)),
    ).toEqual(dateBucketType);
  });
}

describe('useDateBucketType()', () => {
  // Unregister for this test case so that dayjs doesn't throw an error
  beforeAll(() => {
    timezoneMock.unregister();
  });

  it('should return less than a week', () => {
    testUseDateBucketType(DateBucketType.LessThanAWeek, [
      {
        date: '1-1-22',
        now: '1-5-22',
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(6, 'hour').toString(),
      },
    ]);
  });

  it('should return over a week', () => {
    testUseDateBucketType(DateBucketType.OverAWeek, [
      {
        date: '1-1-22',
        now: '1-10-22',
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(1, 'week').toString(),
      },
    ]);
  });

  it('should return over N week', () => {
    testUseDateBucketType(DateBucketType.OverNWeeks, [
      {
        date: '1-1-22',
        now: '1-26-22',
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(2, 'week').toString(),
      },
    ]);
  });

  it('should return over N months', () => {
    testUseDateBucketType(DateBucketType.OverNMonths, [
      {
        date: '1-1-22',
        now: '3-1-22',
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(10, 'week').toString(),
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(3, 'month').toString(),
      },

      // month with 31 days
      {
        date: '1-1-22',
        now: '2-1-22',
      },

      // month with 28 days
      {
        date: '2-1-22',
        now: '3-1-22',
      },

      // month with 30 days
      {
        date: '4-1-22',
        now: '5-1-22',
      },
    ]);
  });

  it('should return over N years', () => {
    testUseDateBucketType(DateBucketType.OverNYears, [
      {
        date: '1-1-22',
        now: '1-1-25',
      },

      {
        date: '1-1-22',
        now: dayjs('1-1-22').add(5, 'year').toString(),
      },
    ]);
  });
});
