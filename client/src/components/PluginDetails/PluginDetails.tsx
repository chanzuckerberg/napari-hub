import clsx from 'clsx';

import { Markdown } from '@/components/common';
import { PluginData } from '@/types';

import { PluginMetadata } from './PluginMetadata';
import { PluginStateProvider, usePluginState } from './PluginStateContext';

interface Props {
  plugin: PluginData;
}

function PluginLeftColumn() {
  return (
    <div className="hidden 3xl:block">
      <PluginMetadata />
    </div>
  );
}

function PluginCenterColumn() {
  const { plugin } = usePluginState();

  return (
    <article className="w-full">
      <h1 className="font-bold text-4xl">{plugin.name}</h1>
      <h2 className="font-semibold my-6 text-lg">{plugin.summary}</h2>
      <Markdown disableHeader>{plugin.description}</Markdown>
    </article>
  );
}

function PluginRightColumn() {
  const { plugin } = usePluginState();

  return (
    <div>
      <Markdown.TOC
        className="fixed hidden 2xl:flex"
        markdown={plugin.description}
      />
    </div>
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
