/**
 * Enum for categorizing the type of sitemap URL. This is primarily used for the
 * HTML sitemap page.
 */
export enum SitemapCategory {
  /**
   * All URLs on the hub that is not dynamic, for example: the home, FAQ, and
   * Privacy pages
   */
  Home = 'home',

  /**
   * All plugin page URLs.
   */
  Plugin = 'plugins',

  /**
   * All collection page URLs.
   */
  Collection = 'collections',
}

/**
 * This interface only includes a subset of the sitemap options. The entire
 * interface can be found here: https://git.io/JBBxu
 */
export interface SitemapEntry {
  /**
   * The type of sitemap entry to determine what section to render the entry on
   * the sitemap HTML page.
   */
  type: SitemapCategory;

  /**
   * The URL to be crawled by the search engine.
   */
  url: string;

  /**
   * The last time this page was modified. This is an optional field and is used
   * by Google if available.
   */
  lastmod?: string;

  /**
   * Name to render on HTML sitemap page if available. This is used primarily
   * for dynamic content like plugins or collections.
   */
  name?: string;
}
