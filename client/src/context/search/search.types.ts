import { PluginIndexData } from '@/types';

/**
 * The interface a browser search engine class needs to implement to index
 * napari plugins and provide search results.
 */
export interface SearchEngine {
  /**
   * Index plugin data list.
   *
   * @param plugins List of plugin index data
   */
  index(plugins: PluginIndexData[]): void;

  /**
   * Searches plugin index using query string.
   *
   * @param query The string to query
   */
  search(query: string): SearchResult[];
}

/**
 * Interface for search result matches. Matches are used for highlighting
 * matched words in the plugin data.
 */
export interface SearchResultMatch {
  /**
   * The start index of the matched substring.
   */
  start: number;

  /**
   * The end index of the matched substring.
   */
  end: number;

  /**
   * The substring extracted using the start and end indices.
   */
  match: string;
}

/**
 * Generic interface for storing a search result. This is used to standardize
 * the search result object so that different libraries / APIs could be used if
 * necessary.
 */
export interface SearchResult {
  /**
   * Array position of plugin in plugin index array data.
   */
  index: number;

  /**
   * The plugin data.
   */
  plugin: PluginIndexData;

  /**
   * Dictionary storing the first text match for a particular key in the plugin
   * index data.
   */
  matches: Partial<Record<string, SearchResultMatch>>;
}
