import Divider from '@material-ui/core/Divider';
import clsx from 'clsx';
import { AnimateSharedLayout, motion } from 'framer-motion';

import { Media } from '@/components/media';
import { FilterKey } from '@/store/search/search.store';
import { useIsFeatureFlagEnabled } from '@/utils/featureFlags';

import { PluginFilterByForm } from './PluginFilterByForm';
import { PluginSortByForm } from './PluginSortByForm';

/**
 * Renders the plugin search controls for filtering and sorting the list of plugins.
 */
export function PluginSearchControls() {
  const divider = (
    <Media className="my-6" greaterThanOrEqual="screen-875">
      <Divider layout component={motion.div} className="bg-black h-1" />
    </Media>
  );

  const isCategoryFiltersEnabled = useIsFeatureFlagEnabled('categoryFilters');
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');
  const requirementFilters: FilterKey[] = [];

  if (isCategoryFiltersEnabled) {
    requirementFilters.push('supportedData');
  }

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
        <PluginSortByForm />

        {divider}

        {isCategoryFiltersEnabled && (
          <>
            <motion.div layout>
              <PluginFilterByForm
                filterType="category"
                filters={['workflowStep', 'imageModality']}
              />
            </motion.div>

            {divider}
          </>
        )}

        <motion.div layout>
          <PluginFilterByForm
            filterType="requirement"
            filters={requirementFilters}
          />
        </motion.div>
      </AnimateSharedLayout>
    </aside>
  );
}
