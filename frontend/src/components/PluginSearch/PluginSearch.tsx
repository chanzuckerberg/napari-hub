import { throttle } from 'lodash';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';

import { Footer, SignupForm } from '@/components';
import { AppBarLanding } from '@/components/AppBar';
import { ColumnLayout, Pagination } from '@/components/common';
import { useLoadingState } from '@/context/loading';
import { searchFormStore } from '@/store/search/form.store';
import { searchResultsStore } from '@/store/search/results.store';
import { getSearchScrollY, setSearchScrollY } from '@/utils';

import { PluginSearchBar } from './PluginSearchBar';
import { PluginSearchControls } from './PluginSearchControls';
import { PluginSearchResultList } from './PluginSearchResultList';

const SCROLL_HANDLER_THROTTLE_MS = 200;

const scrollHandler = throttle(() => {
  setSearchScrollY(window.scrollY);
}, SCROLL_HANDLER_THROTTLE_MS);

/**
 * Updates the current page value and maintains the current scroll location in
 * case the results change the height of the page.
 *
 * @param value Value to append to the page state.
 */
function updatePage(value: number) {
  // Update page value.
  searchFormStore.page += value;

  // Schedule scroll for later execution. Wrap in `raf()` to remove scroll flicker.
  requestAnimationFrame(() => window.scroll(0, document.body.scrollHeight));
}

/**
 * Component for rendering the landing page and plugin search.
 */
export function PluginSearch() {
  const loading = useLoadingState();

  useEffect(() => {
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

    document.addEventListener('scroll', scrollHandler);
    return () => document.removeEventListener('scroll', scrollHandler);
  }, [loading]);

  const { page } = useSnapshot(searchFormStore);
  const {
    results: { totalPages },
  } = useSnapshot(searchResultsStore);

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

      <Pagination
        className="my-6 screen-495:my-12"
        onNextPage={() => updatePage(1)}
        onPrevPage={() => updatePage(-1)}
        page={page}
        totalPages={totalPages}
      />

      <SignupForm variant="home" />
      <Footer />
    </div>
  );
}
