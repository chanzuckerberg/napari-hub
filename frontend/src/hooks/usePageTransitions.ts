import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Logger, setSearchScrollY } from '@/utils';
import { isSearchPage } from '@/utils/page';

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

      // Save `scrollY` if navigating away from the search page.
      if (isSearchPage(router) && !isSearchPage(url)) {
        setSearchScrollY(window.scrollY);
      }

      setNextUrl(url);
      setLoading(true);
    }

    function onFinishLoading(_: string, { shallow }: RouteEvent) {
      if (shallow) return;
      setLoading(false);
    }

    function onError(error: Error, url: string, event: RouteEvent) {
      logger.error('Error loading route:', error);
      onFinishLoading(url, event);
    }

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
