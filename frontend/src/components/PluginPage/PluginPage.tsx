import clsx from 'clsx';
import { Tooltip } from 'czifui';
import { isObject, throttle } from 'lodash';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';
import { Props as ActivityDashboardProps } from 'src/components/ActivityDashboard';

import { AppBarPreview } from '@/components/AppBar';
import { CategoryChipContainer } from '@/components/CategoryChip';
import { ColumnLayout } from '@/components/ColumnLayout';
import { Link } from '@/components/Link';
import { Markdown } from '@/components/Markdown';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { EmptyMetadataTooltip } from '@/components/MetadataHighlighter/EmptyMetadataTooltip';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TOCHeader } from '@/components/TableOfContents';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import {
  useMediaQuery,
  usePlausible,
  usePluginActivity,
  usePluginInstallStats,
} from '@/hooks';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';
import { HubDimension } from '@/types';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { ANCHOR } from './CitationInfo.constants';
import { PluginMetadata } from './PluginMetadata';
import { SupportInfo } from './SupportInfo';

const ActivityDashboard = dynamic<ActivityDashboardProps>(
  () =>
    import('@/components/ActivityDashboard').then(
      (mod) => mod.ActivityDashboard,
    ),
  { ssr: false },
);

function PluginLeftColumn() {
  const hasPluginMetadataScroll = useMediaQuery({ minWidth: 'screen-1425' });

  return (
    <PluginMetadata
      enableScrollID={hasPluginMetadataScroll}
      className="hidden screen-1425:block"
    />
  );
}

function PluginCenterColumn() {
  const containerRef = useRef<HTMLElement>(null);
  const { plugin } = usePluginState();
  const [t] = useTranslation(['common', 'pluginPage', 'preview', 'pluginData']);
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });

  usePreviewClickAway(isNpe2Enabled ? 'metadata-displayName' : 'metadata-name');
  usePreviewClickAway('metadata-summary');
  usePreviewClickAway('metadata-description');

  // Check if body is an empty string or if it's set to the cookiecutter text.
  const isEmptyDescription =
    !plugin?.description ||
    plugin.description.includes(t('preview:emptyDescription'));

  const { dataPoints } = usePluginActivity(plugin?.name);
  const { pluginStats } = usePluginInstallStats(plugin?.name);

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
          disableInteractive
          leaveDelay={0}
        >
          <Link
            className="mt-sds-m screen-495:mt-sds-l text-[0.6875rem] underline"
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
      <ul className="mt-sds-xl text-xs flex flex-wrap gap-sds-s">
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

      <div
        className={clsx(
          // Layout
          'flex screen-875:hidden flex-col',

          // Align CTA and metadata link horizontally for lg layouts
          'screen-600:flex-row screen-600:items-center',

          // Margins
          'my-6 screen-495:mt-30 screen-600:mb-12',
        )}
      >
        <CallToActionButton className="screen-875:hidden" />

        <SkeletonLoader
          className="screen-600:ml-12 screen-1150:ml-0 mt-sds-xl screen-600:mt-0 h-8 w-24"
          render={() => (
            <a
              className={clsx(
                // Text styling
                'underline hover:text-hub-primary-400',

                /*
                  Top margins: This is used for smaller layouts because the CTA
                  button is above the metadata link.
                */
                'mt-sds-xl screen-600:mt-0',

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
      </div>

      <SkeletonLoader
        className="h-[228px] my-6"
        render={() => <SupportInfo className="mb-6 screen-495:mb-12" />}
      />

      <SkeletonLoader
        className="h-[600px] mb-sds-xxl"
        render={() => (
          <MetadataHighlighter
            metadataId="metadata-description"
            className="flex items-center justify-between mb-sds-xxl"
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
        {plugin?.citations && <CitationInfo className="mt-sds-xxl" />}
      </div>

      <PluginMetadata
        enableScrollID={hasPluginMetadataScroll}
        className="screen-1425:hidden"
        inline
      />

      {isActivityDashboardEnabled && plugin?.name && (
        <ActivityDashboard
          data={dataPoints}
          installCount={pluginStats?.totalInstalls ?? 0}
          installMonthCount={pluginStats?.totalMonths ?? 0}
        />
      )}
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
    <div className="col-start-4 screen-1425:col-start-5 hidden screen-1150:block">
      {/*  Keep CTA button and TOC on screen when scrolling on 2xl. */}
      <div className="sticky top-12">
        <CallToActionButton />

        <SkeletonLoader
          className="h-56 mt-sds-xxl"
          render={() => (
            <Markdown.TOC
              className="mt-sds-xxl"
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
    </div>
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
        className="p-sds-xl  screen-495:p-12 screen-875:px-0"
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
