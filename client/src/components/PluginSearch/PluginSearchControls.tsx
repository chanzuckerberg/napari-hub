import clsx from 'clsx';
import { AnimateSharedLayout } from 'framer-motion';

import { PluginFilterByForm } from './PluginFilterByForm';
import { PluginSortByForm } from './PluginSortByForm';

/**
 * Renders the plugin search controls for filtering and sorting the list of plugins.
 */
export function PluginSearchControls() {
  return (
    <aside
      className={clsx(
        // Grid
        'col-span-2 screen-875:col-span-1',

        // Margins
        'mb-6 screen-875:m-0',
      )}
    >
      <AnimateSharedLayout>
        <PluginSortByForm />
        <PluginFilterByForm />
      </AnimateSharedLayout>
    </aside>
  );
}
