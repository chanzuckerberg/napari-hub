/* eslint-disable max-classes-per-file */

import Fuse from 'fuse.js';

import { PluginIndexData } from '@/types';

import { SearchEngine, SearchResult, SearchResultMatch } from './search.types';

/**
 * Minimum length a matched word must be to included in the match result.
 */
const MIN_WORD_LENGTH = 2;

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

      keys: ['authors.name', 'name', 'summary', 'description'],

      /*
        Allow searching with extended search operators:
        https://fusejs.io/examples.html#extended-search
      */
      useExtendedSearch: true,

      /*
        Include search result matches for text highlighting.
      */
      includeMatches: true,
    });
  }

  search(rawQuery: string): SearchResult[] {
    const query = rawQuery.trim();
    const results = this?.fuse?.search(query) ?? [];

    return results.map((result) => {
      const matches: Partial<Record<string, SearchResultMatch>> = {};

      // Populate matches dictionary with match indices and substrings.
      result.matches?.forEach((match) => {
        const { indices, value } = match;
        let { key } = match;

        if (key && value) {
          // Filter matches that are at least `MIN_WORD_LENGTH` long. Only the
          // first match is used for highlighting in case there are multiple
          // matches.
          const [firstMatch] = indices.filter(
            ([start, end]) => end - start >= MIN_WORD_LENGTH,
          );

          // There can be multiple authors, so use the author's name as the key
          // instead.
          if (key === 'authors.name') {
            key = value;
          }

          const [start, end] = firstMatch;
          matches[key] = {
            start,
            end,
            match: value.slice(start, end + 1),
          };
        }
      });

      return {
        matches,
        index: result.refIndex,
        plugin: result.item,
      };
    });
  }
}
