/* eslint-disable max-classes-per-file */

import Fuse from 'fuse.js';
import { maxBy } from 'lodash';
import { compareTwoStrings } from 'string-similarity';

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
      /**
       * Used to match fields depending on how long they are. The shorter the
       * field, the more relevant it is. The default 1, but we need to pass it
       * here because TypeScript will throw an error.
       * https://fusejs.io/concepts/scoring-theory.html#field-length-norm
       */
      fieldNormWeight: 1,

      /**
       * Used to filter matches whose score is less than or equal to the
       * threshold value:
       * https://git.io/J3xRx
       */
      threshold: 0.16,

      /**
       * Finds matches in string regardless of location. This would have the most
       * impact on searching the summary / description because without this, fuse
       * would only be able to match with plugins that have the word at the
       * beginning of the string.
       */
      ignoreLocation: true,

      keys: [
        {
          name: 'name',
          weight: 8,
        },
        {
          name: 'display_name',
          weight: 8,
        },
        {
          name: 'summary',
          weight: 4,
        },
        {
          name: 'authors.name',
          weight: 2,
        },
        {
          name: 'description_text',
          weight: 1,
        },
      ],

      /**
       *  Allow searching with extended search operators:
       *  https://fusejs.io/examples.html#extended-search
       */
      useExtendedSearch: true,

      /**
       * Include search result matches for text highlighting.
       */
      includeMatches: true,
    });
  }

  search(rawQuery: string): SearchResult[] {
    const query = rawQuery.trim();
    const results = this?.fuse?.search(query) ?? [];

    return results.map((result) => ({
      matches: this.findMatches(query, result.matches),
      index: result.refIndex,
      plugin: result.item,
    }));
  }

  /**
   * Finds the most similar match from the Fuse.js matches. Similarity is
   * calculated using Dice-coefficient.
   *
   * @param query The search query
   * @param fuseMatches The fuse.js matches
   * @returns The most similar match
   */
  private findMatches(
    query: string,
    fuseMatches?: readonly Fuse.FuseResultMatch[],
  ) {
    const matches: Partial<Record<string, SearchResultMatch>> = {};

    // Populate matches dictionary with match indices and substrings.
    fuseMatches?.forEach((match) => {
      const { indices, value } = match;
      let { key } = match;

      if (!key || !value) {
        return;
      }

      const mostSimilarMatch = this.findMostSimilarMatch(query, value, indices);
      if (mostSimilarMatch) {
        // There can be multiple authors, so use the author's name as the key
        // instead.
        if (key === 'authors.name') {
          key = value;
        }

        const [start, end] = mostSimilarMatch;
        matches[key] = {
          start,
          end,
          match: value.slice(start, end + 1),
        };
      }
    });

    return matches;
  }

  /**
   * Filter matches that are at least `MIN_WORD_LENGTH` long. Only the most
   * similar match is used for highlighting in case there are multiple matches.
   *
   * Similarity is calculated using the Dice-coefficient from the
   * `string-similarity` package:
   * https://www.npmjs.com/package/string-similarity
   *
   * @param query The search query string
   * @param value The match value
   * @param indices The match indices
   * @returns The index pair for the most similar match
   */
  private findMostSimilarMatch(
    query: string,
    value: string,
    indices: readonly Fuse.RangeTuple[],
  ) {
    return maxBy(
      indices.filter(([start, end]) => end - start >= MIN_WORD_LENGTH),
      ([start, end]) =>
        // Return the string that is the most similar to the raw query.
        // Unfortunately, Fuse.js doesn't provide a similarity score
        // matches, so we have to compute it here.
        compareTwoStrings(query, value.slice(start, end + 1)),
    );
  }
}
