/* eslint-disable max-classes-per-file */

import Fuse from 'fuse.js';

import { PluginIndexData } from '@/types';

import { SearchEngine, SearchResult } from './search.types';

/**
 * Search engine using fuse.js.
 */
export class FuseSearchEngine implements SearchEngine {
  private fuse?: Fuse<PluginIndexData>;

  index(plugins: PluginIndexData[]): void {
    this.fuse = new Fuse(plugins, {
      /*
        Used to filter matches whose score is less than or equal to the
        threshold value:
        https://git.io/J3xRx
      */
      threshold: 0.2,

      /*
        Finds matches in string regardless of location. This would have the most
        impact on searching the summary / description because without this, fuse
        would only be able to match with plugins that have the word at the
        beginning of the string.
      */
      ignoreLocation: true,

      keys: ['authors.name', 'authors.email', 'name', 'summary', 'description'],

      /*
        Allow searching with extended search operators:
        https://fusejs.io/examples.html#extended-search
      */
      useExtendedSearch: true,
    });
  }

  search(rawQuery: string): SearchResult[] {
    const query = rawQuery.trim();
    const results = this?.fuse?.search(query) ?? [];

    return results.map((result) => ({
      index: result.refIndex,
      plugin: result.item,
    }));
  }
}
