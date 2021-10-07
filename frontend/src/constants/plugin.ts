import { PluginData, PluginRepoData } from '@/types';

export const DEFAULT_PLUGIN_DATA: PluginData = {
  authors: [],
  code_repository: '',
  description: '',
  description_content_type: '',
  description_text: '',
  development_status: [],
  documentation: '',
  first_released: '',
  license: '',
  name: '',
  operating_system: [],
  project_site: '',
  python_version: '',
  release_date: '',
  report_issues: '',
  summary: '',
  support: '',
  twitter: '',
  version: '',
  requirements: '',
};

export const DEFAULT_REPO_DATA: PluginRepoData = {
  forks: 0,
  issuesAndPRs: 0,
  stars: 0,
};
