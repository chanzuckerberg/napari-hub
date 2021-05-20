import { Footer, SignupForm } from '@/components';
import { AppBarLanding } from '@/components/AppBar';
import { ColumnLayout } from '@/components/common';

import { PluginSearchBar } from './PluginSearchBar';
import { PluginSearchControls } from './PluginSearchControls';
import { PluginSearchResultList } from './PluginSearchResultList';

/**
 * Component for rendering the landing page and plugin search.
 */
export function PluginSearch() {
  return (
    <>
      <AppBarLanding />
      <PluginSearchBar />

      <div className="min-h-[60vh]">
        <ColumnLayout
          className="p-6 md:p-12"
          classes={{
            gap: 'gap-x-6 md:gap-x-12',
            // Use 3-column layout instead of 4-column layout.
            fourColumn: 'screen-1150:grid-cols-napari-3',
          }}
        >
          <PluginSearchControls />
          <PluginSearchResultList />
        </ColumnLayout>
      </div>

      <SignupForm />
      <Footer />
    </>
  );
}
