import dayjs from 'dayjs';
import { useMemo } from 'react';

import { DataPoint } from '@/types/metrics';

const getKey = (date: dayjs.ConfigType) => dayjs(date).format('MM/YYYY');

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
    const pointMap = new Map<string, DataPoint>(
      visibleMonths.map((date) => [getKey(date), { x: date, y: 0 }]),
    );

    // Only show data that is within range of visible months.
    for (const point of data) {
      // Timestamp for raw data point is in UTC, so we need to convert to UTC
      // before getting the map key
      const key = getKey(dayjs(point.x).utc());
      const mappedPoint = pointMap.get(key);

      if (mappedPoint) {
        pointMap.set(key, {
          x: mappedPoint.x,
          y: point.y,
        });
      }
    }

    // Only show data points after the start date
    for (const [key, point] of pointMap.entries()) {
      pointMap.set(key, {
        x: point.x,
        y: dayjs(point.x).isBefore(release, 'month') ? null : point.y,
      });
    }

    return Array.from(pointMap.values()).sort(
      (point1, point2) => point1.x - point2.x,
    );
  }, [data, release, visibleMonths]);
}
