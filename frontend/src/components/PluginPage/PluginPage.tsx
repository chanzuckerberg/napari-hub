import clsx from 'clsx';
import { Tooltip } from 'czifui';
import { isObject, throttle } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';

import { AppBarPreview } from '@/components/AppBar';
import { CategoryChipContainer } from '@/components/CategoryChip';
import { ColumnLayout } from '@/components/ColumnLayout';
import { Link } from '@/components/Link';
import { Markdown } from '@/components/Markdown';
import { Media, MediaFragment } from '@/components/media';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { EmptyMetadataTooltip } from '@/components/MetadataHighlighter/EmptyMetadataTooltip';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TOCHeader } from '@/components/TableOfContents';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';
import { HubDimension } from '@/types';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { ANCHOR } from './CitationInfo.constants';
import { PluginMetadata } from './PluginMetadata';
import { SupportInfo } from './SupportInfo';

function PluginLeftColumn() {
  return (
    <Media greaterThanOrEqual="3xl">
      <PluginMetadata />
    </Media>
  );
}

function PluginCenterColumn() {
  const containerRef = useRef<HTMLElement>(null);
  const { plugin } = usePluginState();
  const [t] = useTranslation(['common', 'pluginPage', 'preview', 'pluginData']);
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

  usePreviewClickAway(isNpe2Enabled ? 'metadata-displayName' : 'metadata-name');
  usePreviewClickAway('metadata-summary');
  usePreviewClickAway('metadata-description');

  // Check if body is an empty string or if it's set to the cookiecutter text.
  const isEmptyDescription =
    !plugin?.description ||
    plugin.description.includes(t('preview:emptyDescription'));

  return (
    <article
      className={clsx(
        'w-full col-span-2 row-start-1',
        'screen-875:col-span-3',
        'screen-1150:col-start-1',
        'screen-1425:col-start-2',
      )}
      ref={containerRef}
    >
      <SkeletonLoader
        className="h-12"
        render={() => (
          <MetadataHighlighter
            metadataId={
              isNpe2Enabled ? 'metadata-displayName' : 'metadata-name'
            }
            className="flex justify-between"
            highlight={isNpe2Enabled ? !plugin?.display_name : !plugin?.name}
            tooltip={
              <EmptyMetadataTooltip
                className="self-end"
                metadataId={
                  isNpe2Enabled ? 'metadata-displayName' : 'metadata-name'
                }
              />
            }
          >
            <h1
              className={clsx(
                'font-bold text-4xl',
                !plugin?.name && 'text-napari-dark-gray',
              )}
            >
              {(isNpe2Enabled ? plugin?.display_name : undefined) ||
                plugin?.name ||
                t('pluginData:labels.pluginName.label')}
            </h1>
          </MetadataHighlighter>
        )}
      />

      {isNpe2Enabled && plugin?.name && (
        <Tooltip
          title={t('pluginPage:tooltips.viewPypiPackage')}
          placement="right"
          interactive={false}
          leaveDelay={0}
        >
          <Link
            className="mt-[10px] screen-495:mt-3 text-[0.6875rem] underline"
            href={`https://pypi.org/project/${plugin?.name}`}
            newTab
          >
            {plugin?.name}
          </Link>
        </Tooltip>
      )}

      <SkeletonLoader
        className="h-6 my-6"
        render={() => (
          <MetadataHighlighter
            metadataId="metadata-summary"
            className="flex justify-between items-center my-6"
            highlight={!plugin?.summary}
          >
            <h2
              className={clsx(
                'font-semibold text-lg',
                !plugin?.summary && 'text-napari-dark-gray',
              )}
            >
              {plugin?.summary || t('pluginData:labels.summary.preview')}
            </h2>
          </MetadataHighlighter>
        )}
      />

      {/* Plugin categories */}
      <ul className="mt-5 text-xs flex flex-wrap gap-2">
        <SkeletonLoader
          render={() =>
            plugin?.category_hierarchy &&
            isObject(plugin.category_hierarchy) &&
            Object.entries(plugin.category_hierarchy)
              .filter(
                ([pluginDimension]) =>
                  !pluginDimension.includes('Supported data'),
              )
              .map(([pluginDimension, pluginHierarchies]) => (
                <CategoryChipContainer
                  key={pluginDimension}
                  dimension={pluginDimension as HubDimension}
                  hierarchies={pluginHierarchies as string[][]}
                  containerRef={containerRef}
                  pluginName={plugin.name ?? ''}
                />
              ))
          }
        />
      </ul>

      <br />

      <Media
        className={clsx(
          // Layout
          'flex flex-col',

          // Align CTA and metadata link horizontally for lg layouts
          'lg:flex-row lg:items-center',

          // Margins
          'my-6 screen-495:mt-30 screen-600:mb-12',
        )}
        lessThan="3xl"
      >
        <MediaFragment lessThan="2xl">
          <CallToActionButton />
        </MediaFragment>

        <SkeletonLoader
          className="screen-600:ml-12 screen-1150:ml-0 mt-6 screen-600:mt-0 h-8 w-24"
          render={() => (
            <a
              className={clsx(
                // Text styling
                'underline hover:text-napari-primary',

                /*
                  Top margins: This is used for smaller layouts because the CTA
                  button is above the metadata link.
                */
                'mt-6 screen-600:mt-0',

                /*
                  Left margins: This is used when the CTA and metadata link are
                  inline.  The margin is removed when the CTA moves to the right
                  column on 1150px layouts.
                */
                'screen-600:ml-12 screen-1150:ml-0',
              )}
              href="#pluginMetadata"
            >
              {t('pluginPage:viewProjectData')}
            </a>
          )}
        />
      </Media>

      <SkeletonLoader
        className="h-[228px] my-6"
        render={() => <SupportInfo className="mb-6 screen-495:mb-12" />}
      />

      <SkeletonLoader
        className="h-[600px] mb-10"
        render={() => (
          <MetadataHighlighter
            metadataId="metadata-description"
            className="flex items-center justify-between mb-10"
            highlight={isEmptyDescription}
          >
            <Markdown disableHeader placeholder={isEmptyDescription}>
              {plugin?.description || t('preview:emptyDescription')}
            </Markdown>
          </MetadataHighlighter>
        )}
      />

      <div className="mb-6 screen-495:mb-12 screen-1150:mb-20">
        <CallToActionButton />
        {plugin?.citations && <CitationInfo className="mt-10" />}
      </div>

      <MediaFragment lessThan="3xl">
        <PluginMetadata />
      </MediaFragment>
    </article>
  );
}

function PluginRightColumn() {
  const [t] = useTranslation(['pluginPage']);
  const { plugin } = usePluginState();
  const plausible = usePlausible();

  const citationHeader: TOCHeader = {
    id: ANCHOR,
    text: t('pluginPage:citations.title'),
  };

  return (
    <Media
      className="col-start-4 screen-1425:col-start-5"
      greaterThanOrEqual="2xl"
    >
      {/*  Keep CTA button and TOC on screen when scrolling on 2xl. */}
      <div className="sticky top-12">
        <CallToActionButton />

        <SkeletonLoader
          className="h-56 mt-9"
          render={() => (
            <Markdown.TOC
              className="mt-9"
              markdown={plugin?.description ?? ''}
              onClick={(section) => {
                if (plugin?.name) {
                  plausible('Description Nav', {
                    section,
                    plugin: plugin.name,
                  });
                }
              }}
              free
              extraHeaders={plugin?.citations ? [citationHeader] : undefined}
            />
          )}
        />
      </div>
    </Media>
  );
}

const SCROLL_HANDLER_THROTTLE_MS = 200;

let userScrollY = 0;

const scrollHandler = throttle(() => {
  userScrollY = window.scrollY;
}, SCROLL_HANDLER_THROTTLE_MS);

/**
 * Component for rendering the plugin details page.
 */
export function PluginPage() {
  const loading = useLoadingState();

  useEffect(() => {
    if (loading) {
      window.scroll(0, 0);
      document.addEventListener('scroll', scrollHandler);
    } else {
      document.removeEventListener('scroll', scrollHandler);
      window.scroll(0, userScrollY);
      userScrollY = 0;
    }
  }, [loading]);

  return (
    <div className="flex flex-col flex-grow justify-center">
      {process.env.PREVIEW && <AppBarPreview />}

      <ColumnLayout
        className="p-6 md:p-12 2xl:px-0"
        data-testid="pluginDetails"
      >
        <PluginLeftColumn />
        {/*
        The markup for the right column is placed before the center column so
        that keyboard navigation focuses on the right column before the main
        column since the main column can be very long.

        A good example of this is implemented on the W3C site:
        https://www.w3.org/WAI/tutorials/menus/flyout. When tabbing through the
        site, it focuses on the table of contents before the main content.
      */}
        <PluginRightColumn />
        <PluginCenterColumn />
      </ColumnLayout>
    </div>
  );
}
