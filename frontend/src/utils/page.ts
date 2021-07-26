import { NextRouter } from 'next/router';

type UrlType = string | NextRouter;

function getPathname(url: UrlType) {
  if (typeof url === 'string') {
    return new URL(url, 'http://localhost').pathname;
  }

  return url.pathname;
}

export function isSearchPage(url: UrlType): boolean {
  return getPathname(url) === '/';
}

export function isPluginPage(url: UrlType): boolean {
  return getPathname(url).includes('/plugins/');
}
