import { PluginIndexData, PluginType } from './plugin';

export type PluginHomePageData = Pick<
  PluginIndexData,
  | 'authors'
  | 'display_name'
  | 'first_released'
  | 'name'
  | 'release_date'
  | 'summary'
  | 'total_installs'
>;

export type PluginSection<T = Record<string, unknown>> = T & {
  plugins: PluginHomePageData[];
};

export enum PluginSectionType {
  pluginType = 'plugin_types',
  newest = 'newest',
  recentlyUpdated = 'recently_updated',
  topInstalls = 'top_installed',
}

export interface PluginSectionsResponse {
  [PluginSectionType.pluginType]?: PluginSection<{
    type: PluginType;
  }>;
  [PluginSectionType.newest]?: PluginSection;
  [PluginSectionType.recentlyUpdated]?: PluginSection;
  [PluginSectionType.topInstalls]?: PluginSection;
}
