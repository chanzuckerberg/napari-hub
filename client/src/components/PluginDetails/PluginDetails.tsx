import clsx from 'clsx';

import { Markdown } from '@/components/common';
import { PluginData } from '@/types';

interface Props {
  plugin: PluginData;
}

function PluginLeftColumn() {
  return <div />;
}

function PluginCenterColumn({ plugin }: Props) {
  return (
    <article className="w-full">
      <h1 className="font-bold text-4xl">{plugin.name}</h1>
      <h2 className="font-semibold my-6 text-lg">{plugin.summary}</h2>
      <Markdown disableHeader>{plugin.description}</Markdown>
    </article>
  );
}

function PluginRightColumn() {
  return <div />;
}

/**
 * Component for rendering the plugin details page.
 */
export function PluginDetails(props: Props) {
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
      <PluginLeftColumn />
      <PluginCenterColumn {...props} />
      <PluginRightColumn />
    </div>
  );
}
