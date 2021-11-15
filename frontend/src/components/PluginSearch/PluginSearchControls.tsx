import Divider from '@material-ui/core/Divider';
import clsx from 'clsx';
import { AnimateSharedLayout, motion } from 'framer-motion';

import { Media } from '@/components/common/media';

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

        <Media className="my-6" greaterThanOrEqual="screen-875">
          <Divider layout component={motion.div} className="bg-black" />
        </Media>

        <motion.div layout>
          <PluginFilterByForm />
        </motion.div>
      </AnimateSharedLayout>
    </aside>
  );
}
