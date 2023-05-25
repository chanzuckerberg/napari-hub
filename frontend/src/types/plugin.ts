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
  Labels = 'labels',
  Points = 'points',
  Shapes = 'shapes',
  Surface = 'surface',
  Tracks = 'tracks',
  Vectors = 'vectors',
}

export interface PluginAuthor {
  name: string;
  email?: string;
  orcid?: string;
}

export type CitationType = 'citation' | 'RIS' | 'BibTex' | 'APA';

/**
 * Citation formats.
 * */
export type CitationData = Record<CitationType, string>;

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
  authors: PluginAuthor[];
  category?: PluginCategory;
  description_content_type: string;
  description_text: string;
  description: string;
  development_status: string[];
  display_name?: string;
  first_released: string;
  license: string;
  name: string;
  operating_system: string[];
  plugin_types?: PluginType[];
  python_version: string;
  reader_file_extensions?: string[];
  release_date: string;
  summary: string;
  total_installs: number;
  version: string;
  writer_file_extensions?: string[];
  writer_save_layers?: PluginWriterSaveLayer[];
}

/**
 * Interface for plugin data response from backend.
 */
export interface PluginData extends Omit<PluginIndexData, 'total_installs'> {
  action_repository?: string;
  category_hierarchy?: PluginCategoryHierarchy;
  citations?: CitationData;
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
 * Plugin repo data to render with plugin metadata.
 */
export interface PluginRepoData {
  forks: number;
  issuesAndPRs: number;
  stars: number;
  createdAt: string;
}

export enum PluginTabType {
  Activity = 'activity',
  Citation = 'citation',
  Description = 'description',
}
