import clsx from 'clsx';
import { AnimateSharedLayout, motion } from 'framer-motion';

import { useMediaQuery } from '@/hooks';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { FilterKey } from '@/store/search/search.store';

import { PluginFilterByForm } from './PluginFilterByForm';
import { PluginSortByForm } from './PluginSortByForm';

/**
 * Renders the plugin search controls for filtering and sorting the list of plugins.
 */
export function PluginSearchControls() {
  const divider = (
    <motion.hr layout className="bg-black h-1 my-6 hidden screen-875:block" />
  );

  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');
  const isScreen875 = useMediaQuery({ minWidth: 'screen-875' });

  const requirementFilters: FilterKey[] = ['supportedData'];

  if (isNpe2Enabled) {
    requirementFilters.push(
      'pluginType',
      'writerFileExtensions',
      'readerFileExtensions',
    );
  }

  requirementFilters.push(
    'authors',
    'pythonVersion',
    'operatingSystems',
    'license',
  );

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
        <motion.div layout>
          <PluginFilterByForm
            filterType="category"
            filters={['workflowStep', 'imageModality']}
          />
        </motion.div>

        {divider}

        <motion.div layout>
          <PluginFilterByForm
            filterType="requirement"
            filters={requirementFilters}
          />
        </motion.div>

        {!isScreen875 && <PluginSortByForm />}
      </AnimateSharedLayout>
    </aside>
  );
}
