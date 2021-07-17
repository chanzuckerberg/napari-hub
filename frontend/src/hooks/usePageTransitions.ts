import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getSearchBarDistanceFromTop,
  getSearchScrollY,
  Logger,
  setSearchScrollY,
} from '@/utils';
import { isPluginPage, isSearchPage } from '@/utils/page';

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

  // Ref for indicating whether this is the first render or not.
  const initialLoadRef = useRef(true);

  // Ref for storing the current `scrollY` value.
  const scrollYRef = useRef(0);

  // Ref for indicating whether the browser should automatically scroll to the
  // last scroll point.
  const shouldScrollRef = useRef(true);

  // Memoized scroll handler used for updating the scroll refs while the page is
  // loading. The callback needs to be memoized because `removeEventListener()`
  // compares functions by reference.
  const loadingScrollHandler = useCallback(() => {
    if (!initialLoadRef.current) {
      shouldScrollRef.current = false;
    }

    initialLoadRef.current = false;
    scrollYRef.current = window.scrollY;
  }, []);

  useEffect(() => {
    function addScrollHandler() {
      scrollYRef.current = 0;
      shouldScrollRef.current = true;
      document.addEventListener('scroll', loadingScrollHandler);
    }

    function removeScrollHandler() {
      document.removeEventListener('scroll', loadingScrollHandler);
    }

    function onLoading(url: string, { shallow }: RouteEvent) {
      if (shallow) return;

      // Save `scrollY` if navigating away from the search page.
      if (isSearchPage(router) && !isSearchPage(url)) {
        setSearchScrollY(window.scrollY);
      }

      if (isSearchPage(url)) {
        const scrollY = getSearchScrollY();

        // Schedule scroll for later execution. At runtime, the DOM is not yet
        // ready, so layout hasn't been calculated for the page. Because of
        // this, the distance from top will be `0`.
        //
        // The fix is to schedule for later execution using
        // `requestAnimationFrame()`. This will call the function before
        // painting and layout, allowing us to set scroll the before the first
        // render. As a result, this avoids flickering between the top of the
        // page and the `scrollY` location.
        //
        // https://mzl.la/36x9rzG
        requestAnimationFrame(() => {
          window.scroll(0, scrollY);

          // Schedule scroll handler registration for next frame so that above
          // scroll doesn't trigger a scroll event.
          requestAnimationFrame(addScrollHandler);
        });
      } else if (isPluginPage(url)) {
        // Scroll to top of the plugin page loader.
        window.scroll(0, 0);

        // Schedule as macrotask so above scroll doesn't trigger a scroll event.
        setTimeout(addScrollHandler);
      }

      setNextUrl(url);
      setLoading(true);
    }

    function onFinishLoading(url: string, { shallow }: RouteEvent) {
      if (shallow) return;

      removeScrollHandler();

      if (isSearchPage(url)) {
        console.log('finished loading search page');
      } else if (isPluginPage(url)) {
        // Scroll to current scroll position while plugin page was loading. If
        // the user didn't scroll at all, this will be 0.
        window.scroll(0, scrollYRef.current);
      }

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
  }, [loadingScrollHandler, router]);

  return { loading, nextUrl };
}
