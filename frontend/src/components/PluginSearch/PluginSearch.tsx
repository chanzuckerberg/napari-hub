import { throttle } from 'lodash';
import { useEffect } from 'react';
import { snapshot, useSnapshot } from 'valtio';

import { Footer, SignupForm } from '@/components';
import { AppBarLanding } from '@/components/AppBar';
import { ColumnLayout, Pagination } from '@/components/common';
import { loadingStore } from '@/store/loading';
import { searchFormStore } from '@/store/search/form.store';
import { searchResultsStore } from '@/store/search/results.store';
import { scrollToSearchBar } from '@/utils';

import { PluginSearchBar } from './PluginSearchBar';
import { PluginSearchControls } from './PluginSearchControls';
import { PluginSearchResultList } from './PluginSearchResultList';

const SCROLL_HANDLER_THROTTLE_MS = 200;

const scrollHandler = throttle(() => {
  loadingStore.searchScrollY = window.scrollY;
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

  // Scroll to top of results so that the user will see the most relevant for
  // the current page.
  scrollToSearchBar();
}

/**
 * Pagination component using search form and result state for determining the
 * current page and the total pages.
 */
function SearchPagination() {
  const { page } = useSnapshot(searchFormStore);
  const {
    results: { totalPages },
  } = useSnapshot(searchResultsStore);

  return (
    <Pagination
      className="my-6 screen-495:my-12"
      onNextPage={() => updatePage(1)}
      onPrevPage={() => updatePage(-1)}
      page={page}
      totalPages={totalPages}
    />
  );
}

/**
 * Component for rendering the landing page and plugin search.
 */
export function PluginSearch() {
  // Scroll to last scroll location on initial load.
  useEffect(() => {
    const { searchScrollY } = snapshot(loadingStore);

    if (searchScrollY > 0) {
      // Schedule for later execution so that DOM has time to settle.
      requestAnimationFrame(() => window.scroll(0, searchScrollY));
    }
  }, []);

  useEffect(() => {
    document.addEventListener('scroll', scrollHandler);
    return () => document.removeEventListener('scroll', scrollHandler);
  }, []);

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

      <SearchPagination />

      <SignupForm variant="home" />
      <Footer />
    </div>
  );
}
