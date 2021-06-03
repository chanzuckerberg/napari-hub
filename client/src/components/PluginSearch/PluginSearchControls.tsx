import clsx from 'clsx';
import { AnimateSharedLayout } from 'framer-motion';

import { PluginFilterByForm } from './PluginFilterByForm';
import { PluginSortByForm } from './PluginSortByForm';

/**
 * Renders the plugin search controls for filtering and sorting the list of plugins.
 */
export function PluginSearchControls() {
  return (
    <div
      className={clsx(
        'grid gap-6',
        'col-span-2 screen-875:col-span-1 screen-875:row-span-3',
      )}
    >
      <AnimateSharedLayout>
        <PluginSortByForm />
        <PluginFilterByForm />
      </AnimateSharedLayout>
    </div>
  );
}
