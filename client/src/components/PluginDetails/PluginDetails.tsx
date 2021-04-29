import clsx from 'clsx';

import { Markdown } from '@/components/common';
import { Media, MediaFragment } from '@/components/common/media';
import { PluginData } from '@/types';

import { CallToActionButton } from './CallToActionButton';
import { PluginMetadata } from './PluginMetadata';
import { PluginStateProvider, usePluginState } from './PluginStateContext';

interface Props {
  plugin: PluginData;
}

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
    <article className="w-full">
      <h1 className="font-bold text-4xl">{plugin.name}</h1>
      <h2 className="font-semibold my-6 text-lg">{plugin.summary}</h2>

      <Media
        className={clsx(
          // Layout
          'flex flex-col',

          // Align CTA and metadata link horizontally for lg layouts
          'lg:flex-row lg:items-center',

          // Margins
          'my-6 md:my-12',
        )}
        lessThan="3xl"
      >
        <MediaFragment lessThan="2xl">
          <CallToActionButton />
        </MediaFragment>

        <a
          className={clsx(
            // Text styling
            'underline hover:text-napari-primary',

            /*
              Top margins: This is used for smaller layouts because the CTA
              button is above the metadata link.
            */
            'mt-6 md:mt-12 lg:mt-0',

            /*
              Left margins: This is used when the CTA and metadata link are
              inline.  The margin is removed when the CTA moves to the right
              column on 2xl layouts.
            */
            'lg:ml-12 2xl:ml-0',
          )}
          href="#pluginMetadata"
        >
          View project data
        </a>
      </Media>

      <Markdown className="mb-10" disableHeader>
        {plugin.description}
      </Markdown>

      <MediaFragment lessThan="3xl">
        <PluginMetadata />
      </MediaFragment>
    </article>
  );
}

function PluginRightColumn() {
  const { plugin } = usePluginState();

  return (
    <Media greaterThanOrEqual="2xl">
      <CallToActionButton />
      <Markdown.TOC
        className="fixed flex mt-24"
        markdown={plugin.description}
      />
    </Media>
  );
}

/**
 * Component for rendering the plugin details page.
 */
export function PluginDetails({ plugin }: Props) {
  return (
    <div
      data-testid="pluginDetails"
      className={clsx(
        // Layout
        'flex 2xl:grid 2xl:justify-center',

        // Padding
        'p-6 md:p-14 2xl:px-0',

        // Grid gap
        '2xl:gap-14',

        // Grid columns
        '2xl:grid-cols-napari-2-col 3xl:grid-cols-napari-3-col',
      )}
    >
      <PluginStateProvider plugin={plugin}>
        <PluginLeftColumn />
        <PluginCenterColumn />
        <PluginRightColumn />
      </PluginStateProvider>
    </div>
  );
}
