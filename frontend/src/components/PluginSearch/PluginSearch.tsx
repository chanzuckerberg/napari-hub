import { throttle } from 'lodash';
import { useEffect } from 'react';

import { Footer, SignupForm } from '@/components';
import { AppBarLanding } from '@/components/AppBar';
import { ColumnLayout } from '@/components/common';
import { useLoadingState } from '@/context/loading';
import { getSearchScrollY, setSearchScrollY } from '@/utils';

import { PluginSearchBar } from './PluginSearchBar';
import { PluginSearchControls } from './PluginSearchControls';
import { PluginSearchResultList } from './PluginSearchResultList';

const SCROLL_HANDLER_THROTTLE_MS = 200;

const scrollHandler = throttle(() => {
  setSearchScrollY(window.scrollY);
}, SCROLL_HANDLER_THROTTLE_MS);

/**
 * Component for rendering the landing page and plugin search.
 */
export function PluginSearch() {
  const loading = useLoadingState();

  useEffect(() => {
    if (loading) {
      document.addEventListener('scroll', scrollHandler);
    } else {
      document.removeEventListener('scroll', scrollHandler);
    }

    const scrollY = getSearchScrollY();
    if (scrollY > 0) {
      const scrollToLastPosition = () => window.scroll(0, scrollY);

      if (loading) {
        scrollToLastPosition();
      } else {
        // Schedule for later execution so that DOM has time to settle.
        requestAnimationFrame(scrollToLastPosition);
      }
    }
  }, [loading]);

  return (
    <div className="flex flex-col">
      <AppBarLanding />
      <PluginSearchBar />

      <div className="flex-grow min-h-screen">
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

      <SignupForm variant="home" />
      <Footer />
    </div>
  );
}
