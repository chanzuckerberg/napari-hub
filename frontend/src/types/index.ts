import { RequestError } from '@octokit/types';
import { NonFunctionKeys } from 'utility-types';

export interface PluginAuthor {
  name: string;
  email?: string;
  orcid?: string;
}

/**
 * Citation formats.
 * */
export interface CitationData {
  citation: string;
  RIS: string;
  BibTex: string;
  APA: string;
}

export type HubDimension =
  | 'Workflow step'
  | 'Supported data'
  | 'Image modality';

export type PluginCategory = Partial<{
  [key in HubDimension]: string[];
}>;

export type PluginCategoryHierarchy = Partial<{
  [key in HubDimension]: string[][];
}>;

/**
 * Plugin data used for indexing. This is a subset of the full plugin data.
 */
export interface PluginIndexData {
  authors: PluginAuthor[] | '';
  category?: PluginCategory | '';
  description_content_type: string;
  description_text: string;
  description: string;
  development_status: string[] | '';
  display_name?: string;
  first_released: string;
  license: string;
  name: string;
  operating_system: string[] | '';
  python_version: string;
  release_date: string;
  summary: string;
  version: string;
  plugin_types?: PluginType[];
  reader_file_extensions?: string[];
  writer_file_extensions?: string[];
  writer_save_layers?: PluginWriterSaveLayer[];
}

/**
 * Interface for plugin data response from backend.
 */
export interface PluginData extends PluginIndexData {
  action_repository?: string;
  category_hierarchy?: PluginCategoryHierarchy;
  citations?: CitationData | null;
  code_repository: string;
  documentation: string;
  project_site: string;
  release_date: string;
  report_issues: string;
  requirements: string[] | '';
  support: string;
  twitter: string;
}

/**
 * Plugin repo data to render with plugin metadata.
 */
export interface PluginRepoData {
  forks: number;
  issuesAndPRs: number;
  stars: number;
}

export type PluginRepoFetchError = Pick<RequestError, 'name' | 'status'>;

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
}

export type ClassState<T extends object> = {
  [key in NonFunctionKeys<T>]: T[key];
};

// IMPORTANT: The order of the enum properties here matter. See:
// https://github.com/chanzuckerberg/napari-hub/pull/472#pullrequestreview-952464854
export enum PluginType {
  Widget = 'widget',
  Reader = 'reader',
  Writer = 'writer',
  SampleData = 'sample_data',
  Theme = 'theme',
}

export enum PluginWriterSaveLayer {
  Image = 'image',
  Points = 'points',
  Shapes = 'shapes',
}
