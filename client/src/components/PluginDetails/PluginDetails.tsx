import clsx from 'clsx';

import { Markdown } from '@/components/common';
import { Media } from '@/components/common/media';
import { PluginData } from '@/types';

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

      <Media className="my-6 md:my-12" lessThan="3xl">
        <a
          className="underline hover:text-napari-primary"
          href="#pluginMetadata"
        >
          View project data
        </a>
      </Media>

      <Markdown className="mb-10" disableHeader>
        {plugin.description}
      </Markdown>

      <Media lessThan="3xl">
        {(className, render) =>
          render && <PluginMetadata className={className} />
        }
      </Media>
    </article>
  );
}

function PluginRightColumn() {
  const { plugin } = usePluginState();

  return (
    <Media greaterThanOrEqual="2xl">
      <Markdown.TOC className="fixed flex" markdown={plugin.description} />
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
