/**
 * The raw format of the data point represented as a tuple. This gets converted
 * into a normal `DataPoint` type in the object notation below.
 */
export type RawDataPoint = [number, number];

export interface DataPoint {
  /**
   * Numerical value for the x-coordinate of a point to render in a chart. The
   * value is dependent on the the type of chart. For time series, this is the
   * number of milliseconds since January 1, 1970 00:00:00 UTC:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
   */
  x: number;

  /**
   * Numerical value for the y-coordinate of a point to render in a chart. The
   * value is whatever the y metric is for a chart. Null values are allowed to
   * render gaps in the charts.
   */
  y: number | null;
}

export interface PluginInstallStats {
  totalMonths: number;
  totalInstalls: number;
}
