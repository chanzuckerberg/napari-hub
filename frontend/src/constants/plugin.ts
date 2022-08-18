import { PluginData, PluginRepoData } from '@/types';

export const DEFAULT_PLUGIN_DATA: PluginData = {
  authors: [],
  code_repository: '',
  description_content_type: '',
  description_text: '',
  description: '',
  development_status: [],
  display_name: '',
  documentation: '',
  first_released: '',
  license: '',
  name: '',
  operating_system: [],
  project_site: '',
  python_version: '',
  release_date: '',
  report_issues: '',
  requirements: [],
  summary: '',
  support: '',
  twitter: '',
  version: '',
};

export const DEFAULT_REPO_DATA: PluginRepoData = {
  forks: 0,
  issuesAndPRs: 0,
  stars: 0,
};
