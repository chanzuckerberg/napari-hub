export interface PluginAuthor {
  name: string;
  email?: string;
}

/**
 * Interface for plugin data response from backend.
 */
export interface PluginData {
  authors: PluginAuthor[];
  code_repository: string;
  description_content_type: string;
  description: string;
  development_status: string[];
  documentation: string;
  first_released: string;
  license: string;
  name: string;
  operating_system: string[];
  project_site: string;
  python_version: string;
  release_date: string;
  report_issues: string;
  requirements: string[];
  summary: string;
  support: string;
  twitter: string;
  version: string;
}
