import clsx from 'clsx';
import { throttle } from 'lodash';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { AppBarPreview } from '@/components/AppBar';
import { ColumnLayout } from '@/components/common/ColumnLayout';
import { Markdown } from '@/components/common/Markdown';
import { Media, MediaFragment } from '@/components/common/media';
import { PageMetadata } from '@/components/common/PageMetadata';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { TOCHeader } from '@/components/common/TableOfContents';
import { MetadataStatus } from '@/components/MetadataStatus';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import { useIsPreview, usePlausible } from '@/hooks';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { ANCHOR, TITLE } from './CitationInfo.constants';
import { PluginMetadata } from './PluginMetadata';
import { SupportInfo } from './SupportInfo';

const CITATION_HEADER: TOCHeader = {
  id: ANCHOR,
  text: TITLE,
};

function PluginLeftColumn() {
  return (
    <Media greaterThanOrEqual="3xl">
      <PluginMetadata />
    </Media>
  );
}

const EMPTY_DESCRIPTION_PLACEHOLDER =
  'The developer has not yet provided a napari-hub specific description.';

function PluginCenterColumn() {
  const { plugin } = usePluginState();
  const isPreview = useIsPreview();

  // Check if body is an empty string or if it's set to the cookiecutter text.
  const isEmptyDescription =
    !plugin?.description ||
    plugin.description.includes(EMPTY_DESCRIPTION_PLACEHOLDER);

  return (
    <article
      className={clsx(
        'w-full col-span-2 row-start-1',
        'screen-875:col-span-3',
        'screen-1150:col-start-1',
        'screen-1425:col-start-2',
      )}
    >
      <SkeletonLoader
        className="h-12"
        render={() => (
          <div
            id="name"
            className={clsx(
              'flex justify-between',
              !plugin?.name && isPreview && 'bg-napari-preview-orange-overlay',
            )}
          >
            <h1
              className={clsx(
                'font-bold text-4xl',
                !plugin?.name && 'text-napari-dark-gray',
              )}
            >
              {plugin?.name ?? 'Plugin name'}
            </h1>

            {isPreview && !plugin?.name && (
              <MetadataStatus className="self-end" hasValue={false} />
            )}
          </div>
        )}
      />

      <SkeletonLoader
        className="h-6 my-6"
        render={() => (
          <div
            id="summary"
            className={clsx(
              'flex justify-between items-center my-6',
              !plugin?.summary &&
                isPreview &&
                'bg-napari-preview-orange-overlay',
            )}
          >
            <h2
              className={clsx(
                'font-semibold text-lg',
                !plugin?.summary && 'text-napari-dark-gray',
              )}
            >
              {plugin?.summary ?? 'Brief description'}
            </h2>

            {isPreview && !plugin?.summary && (
              <MetadataStatus hasValue={false} />
            )}
          </div>
        )}
      />

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
              View project data
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
          <div
            id="description"
            className={clsx(
              'flex items-center justify-between mb-10',
              isPreview &&
                isEmptyDescription &&
                'bg-napari-preview-orange-overlay',
            )}
          >
            <Markdown disableHeader placeholder={isEmptyDescription}>
              {plugin?.description ?? EMPTY_DESCRIPTION_PLACEHOLDER}
            </Markdown>

            {isPreview && isEmptyDescription && (
              <MetadataStatus hasValue={false} />
            )}
          </div>
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
  const { plugin } = usePluginState();
  const plausible = usePlausible();

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
              extraHeaders={plugin?.citations ? [CITATION_HEADER] : undefined}
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
export function PluginDetails() {
  const loading = useLoadingState();
  const { plugin } = usePluginState();
  const router = useRouter();
  const isPreview = useIsPreview();

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

  const keywords: string[] = [];
  let title = 'napari hub | plugins';
  if (plugin?.name && plugin?.authors) {
    title = `${title} | ${plugin.name}`;

    const authors = plugin.authors.map(({ name }) => name).join(', ');
    if (authors) {
      title = `${title} by ${authors}`;
    }

    for (const { name } of plugin.authors ?? []) {
      if (name) {
        keywords.push(plugin.name, name);
      }
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <PageMetadata
          keywords={keywords}
          description={plugin?.summary}
          pathname={router.pathname}
        />
      </Head>

      {isPreview && <AppBarPreview />}

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
    </>
  );
}
