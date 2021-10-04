import { proxy } from 'valtio';

/**
 * Store used for holding loading related data.
 */
export const loadingStore = proxy({
  /**
   * Most recent scrollY position on the search page. This is set when
   * navigating away from the search page, and is used when navigating back in
   * the browser history.
   */
  searchScrollY: 0,

  /**
   * Data related to rendering skeleton pages.
   *
   * TODO Look into consolidating existing loading context into this store.
   */
  skeleton: {
    /**
     * The pixel heights for each result in the most recent search result list.
     */
    resultHeights: [] as number[],
  },
});

export function resetLoadingState(): void {
  loadingStore.searchScrollY = 0;
  loadingStore.skeleton.resultHeights = [];
}
