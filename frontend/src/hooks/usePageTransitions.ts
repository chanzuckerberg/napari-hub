import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';

import { loadingStore } from '@/store/loading';
import { pageTransitionsStore } from '@/store/pageTransitions';
import { Logger } from '@/utils';

import { usePageUtils } from './usePageUtils';

const logger = new Logger('usePageTransitions.ts');

/**
 * Event data for route transitions.
 * https://nextjs.org/docs/api-reference/next/router#routerevents
 */
interface RouteEvent {
  // Boolean for if route fetched data
  /**
   * Boolean indicating if route fetched data or not:
   */
  shallow: boolean;
}

/**
 * Hook to manage page transitions effects and state.
 */
export function usePageTransitions() {
  const router = useRouter();

  const initalLoadRef = useRef(true);
  if (initalLoadRef.current) {
    initalLoadRef.current = false;
    pageTransitionsStore.nextUrl = router.asPath;
  }

  const snap = useSnapshot(pageTransitionsStore);
  const { isSearchPage } = usePageUtils();

  useEffect(() => {
    function onLoading(url: string, { shallow }: RouteEvent) {
      if (shallow) return;

      // If user is navigating away from the search page.
      if (isSearchPage(router) && !isSearchPage(url)) {
        // Save `scrollY` if navigating away from the search page.
        loadingStore.searchScrollY = window.scrollY;

        const searchResults = Array.from(
          document.querySelectorAll('.searchResult'),
        );
        loadingStore.skeleton.resultHeights = searchResults.map(
          (result) => (result as HTMLElement).offsetHeight,
        );
      }

      pageTransitionsStore.nextUrl = url;
      pageTransitionsStore.loading = true;
    }

    function onFinishLoading(_: string, { shallow }: RouteEvent) {
      if (shallow) return;
      pageTransitionsStore.loading = false;
    }

    const onError = (error: Error, url: string, event: RouteEvent) => {
      logger.error('Error loading route:', error);
      onFinishLoading(url, event);
    };

    router.events.on('routeChangeStart', onLoading);
    router.events.on('routeChangeComplete', onFinishLoading);
    router.events.on('routeChangeError', onError);

    return () => {
      router.events.off('routeChangeStart', onLoading);
      router.events.off('routeChangeComplete', onFinishLoading);
      router.events.off('routeChangeError', onError);
    };
  }, [isSearchPage, router]);

  return snap;
}
