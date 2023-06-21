import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { loadingStore } from '@/store/loading';
import { Logger } from '@/utils';
import { isHomePage } from '@/utils/page';

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
  const [loading, setLoading] = useState(false);

  // URL state for components to know what URL is currently loading.
  const [nextUrl, setNextUrl] = useState('');

  useEffect(() => {
    function onLoading(url: string, { shallow }: RouteEvent) {
      if (shallow) return;

      // If user is navigating away from the search page.
      if (isHomePage(router) && !isHomePage(url)) {
        // Save `scrollY` if navigating away from the search page.
        loadingStore.searchScrollY = window.scrollY;

        const searchResults = Array.from(
          document.querySelectorAll('.searchResult'),
        );
        loadingStore.skeleton.resultHeights = searchResults.map(
          (result) => (result as HTMLElement).offsetHeight,
        );
      }

      setNextUrl(url);
      setLoading(true);
    }

    function onFinishLoading(_: string, { shallow }: RouteEvent) {
      if (shallow) return;
      setLoading(false);
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
  }, [router]);

  return { loading, nextUrl };
}
