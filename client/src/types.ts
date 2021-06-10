import { ComponentType } from 'react';

import { IconProps } from '@/components/common/icons';

export interface PluginAuthor {
  name: string;
  email?: string;
}

/**
 * Plugin data used for indexing. This is a subset of the full plugin data.
 */
export interface PluginIndexData {
  authors: PluginAuthor[];
  description_content_type: string;
  description: string;
  development_status: string[];
  first_released: string;
  license: string;
  name: string;
  operating_system: string[];
  python_version: string;
  release_date: string;
  summary: string;
  version: string;
}

/**
 * Interface for plugin data response from backend.
 */
export interface PluginData extends PluginIndexData {
  code_repository: string;
  documentation: string;
  project_site: string;
  release_date: string;
  report_issues: string;
  requirements: string[];
  support: string;
  twitter: string;
}

/**
 * Data used for rendering links in the app.
 */
export interface LinkInfo {
  /**
   * URL of this link.
   */
  link: string;
  /**
   * Title of the link to use.
   */
  title: string;
  /**
   * If the link should open in a new tab.
   */
  newTab?: boolean;
  /**
   * Icon associated with the link.
   */
  icon?: ComponentType<IconProps>;
}
