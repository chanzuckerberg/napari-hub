import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export enum DateBucketType {
  LessThanAWeek,
  OverAWeek,
  OverNWeeks,
  OverNMonths,
  OverNYears,
}

export function useDateBucketType(
  date: dayjs.Dayjs,
  now = dayjs(),
): DateBucketType {
  const days = now.diff(date, 'day');

  if (days < 7) {
    return DateBucketType.LessThanAWeek;
  }

  if (days < 14) {
    return DateBucketType.OverAWeek;
  }

  const months = now.diff(date, 'month');

  if (months < 1) {
    return DateBucketType.OverNWeeks;
  }

  if (months < 24) {
    return DateBucketType.OverNMonths;
  }

  return DateBucketType.OverNYears;
}

export function useFormattedDuration(
  date: dayjs.Dayjs,
  dateBucketType: DateBucketType,
): string {
  const [t] = useTranslation(['activity']);

  return useMemo(() => {
    const now = dayjs();

    switch (dateBucketType) {
      case DateBucketType.LessThanAWeek:
      case DateBucketType.OverAWeek:
        return t('activity:duration.weekAgo');

      case DateBucketType.OverNWeeks: {
        const weeks = now.diff(date, 'weeks');
        return t('activity:duration.nWeeksAgo', {
          count: weeks,
          replace: { weeks },
        });
      }

      case DateBucketType.OverNMonths: {
        const months = now.diff(date, 'month');
        return t('activity:duration.nMonthsAgo', {
          count: months,
          replace: { months },
        });
      }

      case DateBucketType.OverNYears: {
        const years = now.diff(date, 'years');
        return t('activity:duration.nYearsAgo', {
          count: years,
          replace: { years },
        });
      }

      default:
        return date.fromNow();
    }
  }, [date, dateBucketType, t]);
}
