import { NextRouter } from 'next/router';
import { useMemo } from 'react';

type UrlType = string | NextRouter;

function getPathname(url: UrlType) {
  if (typeof url === 'string') {
    return new URL(url, 'http://localhost').pathname;
  }

  return url.pathname;
}

export function usePageUtils() {
  return useMemo(
    () => ({
      isHomePage(url: UrlType): boolean {
        return getPathname(url) === '/';
      },

      isSearchPage(url: UrlType): boolean {
        return getPathname(url) === '/plugins';
      },

      isPluginPage(url: UrlType): boolean {
        return getPathname(url).includes('/plugins/');
      },

      isSitemapPage(url: UrlType): boolean {
        return getPathname(url).endsWith('/sitemap');
      },
    }),
    [],
  );
}
