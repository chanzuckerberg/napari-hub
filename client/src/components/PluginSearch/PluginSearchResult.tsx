import clsx from 'clsx';
import { isEmpty } from 'lodash';

import { Link, TextHighlighter } from '@/components/common';
import { SearchResultMatch } from '@/context/search';
import { PluginIndexData } from '@/types';
import { formatDate, formatOperatingSystem } from '@/utils';

interface Props {
  /**
   * Class applied to root element.
   */
  className?: string;

  /**
   * The plugin data.
   */
  plugin: PluginIndexData;

  /**
   * Search engine matches for text highlighting.
   */
  matches: Partial<Record<string, SearchResultMatch>>;
}

interface SearchResultItem {
  label: string;
  value: string;
}

/**
 * Number of characters to show on the left and right sides of the matched
 * substring.
 */
const MAX_PREVIEW_LENGTH = 40;

/**
 * Helper function that returns a substring of the plugin description that
 * includes the highlighted word and a constant buffer before and after the
 * highlighted word.
 *
 * @param description The plugin description
 * @param start The start index of the highlighted word
 * @param end The end index of the highlighted word
 * @returns The description preview substring
 */
function getDescriptionPreview(
  description: string,
  match: SearchResultMatch,
): string {
  const minIndex = 0;
  const maxIndex = description.length - 1;

  const start = match.start - MAX_PREVIEW_LENGTH;
  const end = match.end + MAX_PREVIEW_LENGTH;
  let previewStart = Math.max(minIndex, start);
  let previewEnd = Math.min(maxIndex, end);

  // If the start / end index overflows, append `diff` characters to the other
  // side of the preview.
  if (start < minIndex) {
    const diff = minIndex - start;
    previewEnd = Math.min(maxIndex, previewEnd + diff);
  }
  if (end >= maxIndex) {
    const diff = end - maxIndex;
    previewStart = Math.max(minIndex, start - diff);
  }

  let preview = description.slice(previewStart, previewEnd + 1);

  // Only append `...` if the preview doesn't reach the start / end of the description.
  if (previewStart > minIndex) {
    preview = `...${preview}`;
  }
  if (previewEnd < maxIndex) {
    preview += '...';
  }

  return preview;
}

/**
 * Component for rendering a plugin search result.
 */
export function PluginSearchResult({ className, matches, plugin }: Props) {
  // TODO consolidate with PluginGithubData component in PluginMetadata.tsx
  const items: SearchResultItem[] = [
    {
      label: 'version',
      value: plugin.version,
    },
    {
      label: 'release date',
      value: formatDate(plugin.release_date),
    },
    {
      label: 'license',
      value: plugin.license,
    },
    {
      label: 'Python version',
      value: plugin.python_version,
    },
    {
      label: 'operating system',
      value: plugin.operating_system.map(formatOperatingSystem).join(', '),
    },
  ];

  const isSearching = !isEmpty(matches);

  /**
   * Helper function to render highlighted text when searching.
   *
   * @param text The text to render.
   * @param word The word that needs to be highlighted.
   */
  function renderText(text: string, word: string | undefined) {
    return (
      <TextHighlighter disabled={!isSearching} words={[word]}>
        {text}
      </TextHighlighter>
    );
  }

  return (
    <Link
      className={clsx(
        className,
        'py-5 border-t-2 border-black hover:bg-napari-hover-gray',
      )}
      href={`/plugins/${plugin.name}`}
    >
      <article
        data-testid="searchResult"
        className={clsx(
          'grid gap-x-6 md:gap-x-12',
          'screen-600:grid-cols-napari-2',
          'screen-1425:grid-cols-napari-3',
        )}
      >
        <div className="screen-1425:col-span-2 flex flex-col justify-between">
          {/* Wrapper div to group plugin name and summary  */}
          <div>
            {/* Plugin name */}
            <h4
              className="inline font-bold text-lg"
              data-testid="searchResultName"
            >
              {renderText(plugin.name, matches.name?.match)}
            </h4>

            {/* Plugin summary */}
            <p className="mt-2" data-testid="searchResultSummary">
              {renderText(plugin.summary, matches.summary?.match)}
            </p>
          </div>

          {/* Plugin authors */}
          <ul className="mt-5 text-xs">
            {plugin.authors.map((author) => (
              <li
                className="my-2 font-bold"
                key={author.name}
                data-testid="searchResultAuthor"
              >
                {renderText(author.name, matches[author.name]?.match)}
              </li>
            ))}
          </ul>

          {/* Search preview of plugin description. */}
          {isSearching && matches.description && (
            <TextHighlighter
              className="italic text-xs"
              words={[matches.description.match]}
            >
              {getDescriptionPreview(plugin.description, matches.description)}
            </TextHighlighter>
          )}
        </div>

        {/* Plugin metadata */}
        <ul className="mt-4 screen-600:m-0 space-y-1 text-sm">
          {items.map((item) => (
            <li
              key={`${item.label}-${item.value}`}
              className="grid grid-cols-[auto,1fr]"
            >
              <h5 className="inline whitespace-nowrap">{item.label}: </h5>
              <span className="font-bold ml-1">{item.value}</span>
            </li>
          ))}
        </ul>
      </article>
    </Link>
  );
}
