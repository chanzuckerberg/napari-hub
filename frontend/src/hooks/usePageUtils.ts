import { NextRouter } from 'next/router';
import { useMemo } from 'react';

import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

type UrlType = string | NextRouter;

function getPathname(url: UrlType) {
  if (typeof url === 'string') {
    return new URL(url, 'http://localhost').pathname;
  }

  return url.pathname;
}

export function usePageUtils() {
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');

  return useMemo(
    () => ({
      isHomePage(url: UrlType): boolean {
        return getPathname(url) === '/';
      },

      isSearchPage(url: UrlType): boolean {
        return getPathname(url) === (isHomePageRedesign ? '/plugins' : '/');
      },

      isPluginPage(url: UrlType): boolean {
        return getPathname(url).includes('/plugins/');
      },

      isSitemapPage(url: UrlType): boolean {
        return getPathname(url).endsWith('/sitemap');
      },
    }),
    [isHomePageRedesign],
  );
}
