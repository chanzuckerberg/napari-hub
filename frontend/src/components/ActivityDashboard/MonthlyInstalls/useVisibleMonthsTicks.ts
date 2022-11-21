import dayjs from 'dayjs';
import { useMemo } from 'react';

/**
 * Returns the last 12 months excluding the current month normalized to the end
 * of the month. This is primarily used for rendering the ticks on the area
 * chart and getting the min / max dates.
 */
export function useVisibleMonthsTicks(): number[] {
  return useMemo(() => {
    const now = dayjs();
    return Array.from(Array(12))
      .map((_, idx) =>
        now
          .subtract(idx + 1, 'month')
          .endOf('month')
          .toDate()
          .getTime(),
      )
      .sort();
  }, []);
}
