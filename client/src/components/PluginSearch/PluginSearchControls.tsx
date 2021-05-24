import clsx from 'clsx';
import { AnimateSharedLayout } from 'framer-motion';

import { PluginSortByForm } from './PluginSortByForm';

/**
 * Renders a JSON string of the search state. This should be replaced with the
 * actual sort and filter components.
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
      </AnimateSharedLayout>
    </div>
  );
}
