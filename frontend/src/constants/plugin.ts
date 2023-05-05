import { PluginData, PluginIndexData, PluginRepoData } from '@/types';

export const DEFAULT_PLUGIN_INDEX_DATA: PluginIndexData = {
  authors: [],
  description_content_type: '',
  description_text: '',
  description: '',
  development_status: [],
  display_name: '',
  first_released: '',
  license: '',
  name: '',
  operating_system: [],
  python_version: '',
  release_date: '',
  summary: '',
  total_installs: 0,
  version: '',
};

export const DEFAULT_PLUGIN_DATA: PluginData = {
  ...DEFAULT_PLUGIN_INDEX_DATA,
  code_repository: '',
  documentation: '',
  project_site: '',
  release_date: '',
  report_issues: '',
  requirements: [],
  summary: '',
  support: '',
  twitter: '',
};

export const DEFAULT_REPO_DATA: PluginRepoData = {
  forks: 0,
  issuesAndPRs: 0,
  stars: 0,
  createdAt: '',
};
