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
