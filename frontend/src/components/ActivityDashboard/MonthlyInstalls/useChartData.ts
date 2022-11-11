import dayjs from 'dayjs';
import { useMemo } from 'react';

import { DataPoint } from '@/types/stats';

/**
 * Creates a new instance of the chart data that is normalized to only include
 * data for the last 12 months. Any data points that are found before the
 * release date are set to null so that its rendered as a gap in the chart.
 */
export function useChartData(
  data: DataPoint[],
  release: dayjs.Dayjs,
  visibleMonths: number[],
) {
  return useMemo(() => {
    const pointMap = new Map<number, number | null>(
      visibleMonths.map((date) => [date, 0]),
    );

    // Only show data that is within range of visible months.
    for (const point of data) {
      const date = dayjs(point.x).endOf('month');
      const x = date.toDate().getTime();

      if (pointMap.has(x)) {
        pointMap.set(x, point.y);
      }
    }

    // Only show data points after the start date
    for (const [x, y] of pointMap.entries()) {
      pointMap.set(x, dayjs(x).isBefore(release, 'month') ? null : y);
    }

    return Array.from(pointMap.entries())
      .map(([x, y]) => ({ x, y }))
      .sort((point1, point2) => point1.x - point2.x);
  }, [data, release, visibleMonths]);
}
