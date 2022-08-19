import clsx from 'clsx';
import { isArray, isEmpty, isObject, isString } from 'lodash';
import { useTranslation } from 'next-i18next';
import React, { CSSProperties, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useSnapshot } from 'valtio';

import { CategoryChipContainer } from '@/components/CategoryChip';
import { Link } from '@/components/Link';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TextHighlighter } from '@/components/TextHighlighter';
import { useLoadingState } from '@/context/loading';
import { useSearchStore } from '@/store/search/context';
import { FilterCategoryKeys } from '@/store/search/search.store';
import { SearchResultMatch } from '@/store/search/search.types';
import { HubDimension, PluginIndexData } from '@/types';
import { I18nKeys, I18nPluginDataLabel } from '@/types/i18n';
import { createUrl, formatDate, formatOperatingSystem } from '@/utils';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import styles from './PluginSearchResult.module.scss';

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

  style?: CSSProperties;
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
export function PluginSearchResult({
  className,
  matches,
  plugin,
  style,
}: Props) {
  const [t] = useTranslation(['pluginData', 'homePage']);
  const isLoading = useLoadingState();
  const [isHoveringOverChip, setIsHoveringOverChip] = useState(false);
  const [debouncedIsHoveringOverChip] = useDebounce(isHoveringOverChip, 100);
  const containerRef = useRef<HTMLElement>(null);
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

  const { searchStore } = useSearchStore();
  const snap = useSnapshot(searchStore);
  const resultURL = useMemo(() => {
    const url = createUrl(`/plugins/${plugin.name}`);
    const states: FilterCategoryKeys[] = ['workflowStep', 'imageModality'];

    for (const stateKey of states) {
      const state = snap.filters[stateKey];

      for (const [filterKey, filterValue] of Object.entries(state)) {
        if (filterValue) {
          url.searchParams.append(stateKey, filterKey);
        }
      }
    }

    return url.pathname + url.search;
  }, [plugin.name, snap]);

  const getLower = (label: I18nPluginDataLabel) =>
    isString(label) ? label : label.lower ?? label.label;

  function getItems(
    ...items: Array<{
      label: I18nPluginDataLabel;
      value: string;
    }>
  ): SearchResultItem[] {
    return items.map((item) => ({
      label: getLower(item.label),
      value: item.value,
    }));
  }

  // TODO consolidate with PluginGithubData component in PluginMetadata.tsx
  const items = isLoading
    ? []
    : getItems(
        {
          label: t('pluginData:labels.version'),
          value: plugin.version,
        },

        {
          label: t('pluginData:labels.releaseDate'),
          value: formatDate(plugin.release_date),
        },

        ...(isNpe2Enabled
          ? [
              {
                label: t('pluginData:labels.pluginType'),
                value: isArray(plugin.plugin_types)
                  ? plugin.plugin_types
                      .map((pluginType) =>
                        t(
                          `homePage:filter.requirement.${pluginType}.label` as I18nKeys<'homePage'>,
                        ),
                      )
                      .join(', ')
                  : '',
              },
            ]
          : [
              {
                label: t('pluginData:labels.license'),
                value: plugin.license,
              },

              {
                label: t('pluginData:labels.pythonVersion'),
                value: plugin.python_version,
              },

              {
                label: t('pluginData:labels.operatingSystem'),
                value: isArray(plugin.operating_system)
                  ? plugin.operating_system
                      .map(formatOperatingSystem)
                      .join(', ')
                  : '',
              },
            ]),
      );

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

  function renderResult() {
    return (
      <article
        data-testid="searchResult"
        className={clsx(
          'grid gap-x-sds-xl screen-495:gap-x-12',
          'screen-600:grid-cols-2',
          'screen-1425:grid-cols-napari-3',
        )}
        ref={containerRef}
      >
        <div className="screen-1425:col-span-2 flex flex-col justify-between">
          {/* Wrapper div to group plugin name and summary  */}
          <div>
            {/* Plugin name */}
            <h4 className="font-bold text-lg" data-testid="searchResultName">
              <SkeletonLoader
                render={() =>
                  renderText(
                    (isNpe2Enabled ? plugin.display_name : undefined) ||
                      plugin.name,

                    isNpe2Enabled && plugin.display_name
                      ? matches.display_name?.match
                      : matches.name?.match,
                  )
                }
              />
            </h4>

            {isNpe2Enabled && (
              <span className="mt-sds-m screen-495:mt-sds-l text-[0.6875rem]">
                <SkeletonLoader
                  className="h-12"
                  render={() => renderText(plugin.name, matches.name?.match)}
                />
              </span>
            )}

            {/* Plugin summary */}
            <p
              className={clsx(
                isNpe2Enabled ? 'mt-sds-xl screen-495:mt-sds-xl ' : 'mt-sds-s',
              )}
              data-testid="searchResultSummary"
            >
              <SkeletonLoader
                className="h-12"
                render={() =>
                  renderText(plugin.summary, matches.summary?.match)
                }
              />
            </p>
          </div>

          {/* Plugin authors */}
          <ul className="mt-sds-xl text-xs">
            <SkeletonLoader
              render={() =>
                isArray(plugin.authors) &&
                plugin.authors.map((author) => (
                  <li
                    className={clsx(['my-sds-s font-bold', styles.linkItem])}
                    key={author.name}
                    data-testid="searchResultAuthor"
                  >
                    {renderText(author.name, matches[author.name]?.match)}
                  </li>
                ))
              }
            />
          </ul>

          {/* Search preview of plugin description. */}
          {isSearching && matches.description_text && (
            <TextHighlighter
              className="italic text-xs"
              words={[matches.description_text.match]}
            >
              {getDescriptionPreview(
                plugin.description_text,
                matches.description_text,
              )}
            </TextHighlighter>
          )}
        </div>

        {/* Plugin metadata */}
        <ul className="mt-sds-l screen-600:m-0 space-y-1 text-sm">
          <SkeletonLoader
            className="h-full"
            render={() =>
              items.map((item) => (
                <li
                  data-testid="searchResultMetadata"
                  data-label={item.label}
                  data-value={item.value}
                  key={`${item.label}-${item.value}`}
                  className="grid grid-cols-[auto,1fr]"
                >
                  <h5 className="inline whitespace-nowrap lowercase">
                    {item.label}
                  </h5>
                  <span
                    className={clsx(
                      'ml-sds-xxs',
                      item.value ? 'font-bold' : 'text-napari-gray',
                    )}
                  >
                    {item.value || 'information not submitted'}
                  </span>
                </li>
              ))
            }
          />
        </ul>

        {/* Plugin categories */}
        <ul
          className={clsx(
            'mt-sds-xl text-xs',
            'flex flex-col gap-sds-s',
            'col-span-2 screen-1425:col-span-3',
          )}
        >
          <SkeletonLoader
            render={() =>
              isObject(plugin.category) &&
              Object.entries(plugin.category)
                .filter(
                  ([pluginDimension]) =>
                    !pluginDimension.includes('Supported data'),
                )
                .map(([pluginDimension, pluginCategories]) => (
                  <CategoryChipContainer
                    key={pluginDimension}
                    dimension={pluginDimension as HubDimension}
                    categories={pluginCategories}
                    setIsHovering={setIsHoveringOverChip}
                    containerRef={containerRef}
                    pluginName={plugin.name}
                  />
                ))
            }
          />
        </ul>
      </article>
    );
  }

  const resultClassName = clsx(
    className,
    'searchResult',
    'py-sds-xl border-black border-t-2 last:border-b-2',
  );

  // Convert to link when loading so that user can't click on result.
  if (isLoading) {
    return (
      <div className={resultClassName} style={style}>
        {renderResult()}
      </div>
    );
  }

  return (
    <Link
      data-testid="pluginSearchResult"
      className={clsx(
        resultClassName,
        !debouncedIsHoveringOverChip && 'hover:bg-hub-gray-100',
      )}
      href={resultURL}
      style={style}
    >
      {renderResult()}
    </Link>
  );
}
