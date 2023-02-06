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

interface TimelineDataPoint {
  timestamp: number;
}

interface InstallsTimelineDataPoint extends TimelineDataPoint {
  installs: number;
}

interface CommitsTimelineDataPoint extends TimelineDataPoint {
  commits: number;
}

interface PluginUsageStats {
  installs_in_last_30_days: number;
  total_installs: number;
}

interface PluginUsage {
  stats: PluginUsageStats;
  timeline: InstallsTimelineDataPoint[];
}

interface PluginMaintenanceStats {
  latest_commit_timestamp: number | null;
  total_commits: number | null;
}

interface PluginMaintenance {
  stats: PluginMaintenanceStats;
  timeline: CommitsTimelineDataPoint[];
}

export interface PluginMetrics {
  maintenance: PluginMaintenance;
  usage: PluginUsage;
}
