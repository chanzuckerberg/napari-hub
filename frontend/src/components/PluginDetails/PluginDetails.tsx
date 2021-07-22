import clsx from 'clsx';

import { ColumnLayout, Markdown, SkeletonLoader } from '@/components/common';
import { Media, MediaFragment } from '@/components/common/media';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';

import { CallToActionButton } from './CallToActionButton';
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
  const { plugin } = usePluginState();

  return (
    <article className="w-full col-span-2 screen-875:col-span-3">
      <SkeletonLoader
        className="h-12"
        render={() => <h1 className="font-bold text-4xl">{plugin.name}</h1>}
      />

      <SkeletonLoader
        className="h-6 my-6"
        render={() => (
          <h2 className="font-semibold my-6 text-lg">{plugin.summary}</h2>
        )}
      />

      <Media
        className={clsx(
          // Layout
          'flex flex-col',

          // Align CTA and metadata link horizontally for lg layouts
          'lg:flex-row lg:items-center',

          // Margins
          'my-6 screen-495:mt-12 screen-600:mb-12',
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
          <Markdown className="mb-10" disableHeader>
            {plugin.description}
          </Markdown>
        )}
      />

      <div className="mb-6 screen-495:mb-12 screen-1150:mb-20">
        <CallToActionButton />
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
    <Media greaterThanOrEqual="2xl">
      {/*  Keep CTA button and TOC on screen when scrolling on 2xl. */}
      <div className="sticky top-12">
        <CallToActionButton />

        <SkeletonLoader
          className="h-56 mt-9"
          render={() => (
            <Markdown.TOC
              className="mt-9"
              markdown={plugin.description}
              onClick={(section) => {
                plausible('Description Nav', {
                  section,
                  plugin: plugin.name,
                });
              }}
              free
            />
          )}
        />
      </div>
    </Media>
  );
}

/**
 * Component for rendering the plugin details page.
 */
export function PluginDetails() {
  return (
    <ColumnLayout className="p-6 md:p-12 2xl:px-0" data-testid="pluginDetails">
      <PluginLeftColumn />
      <PluginCenterColumn />
      <PluginRightColumn />
    </ColumnLayout>
  );
}
