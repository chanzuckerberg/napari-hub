import { atom } from 'jotai';

import { PluginData, PluginRepoData, PluginRepoFetchError } from '@/types';

export const DEFAULT_PLUGIN_STATE: PluginData = {
  name: '',
  summary: '',
  description: '',
  description_text: '',
  description_content_type: '',
  authors: [],
  license: '',
  python_version: '',
  operating_system: [],
  release_date: '',
  version: '',
  first_released: '',
  development_status: [''],
  requirements: [],
  project_site: '',
  documentation: '',
  support: '',
  report_issues: '',
  twitter: '',
  code_repository: '',
};

export const DEFAULT_REPO_STATE: PluginRepoData = {
  forks: 0,
  issuesAndPRs: 0,
  stars: 0,
};

/**
 * State for plugin data.
 */
export const pluginState = atom<PluginData>(DEFAULT_PLUGIN_STATE);

/**
 * State for plugin repo data. This includes fork, issue, and star counts.
 */
export const repoState = atom<PluginRepoData>(DEFAULT_REPO_STATE);

/**
 * State for any fetch errors that may occur while fetching the plugin repo data.
 */
export const repoFetchErrorState = atom<PluginRepoFetchError | null>(null);
