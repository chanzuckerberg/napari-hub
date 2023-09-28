import { Page } from '@playwright/test';
import { AccordionTitle } from 'e2e/types/filter';

import { PROD, STAGING } from '@/constants/env';
import { SearchQueryParams } from '@/store/search/constants';
import { breakpoints } from '@/theme/breakpoints';

export function getTestURL(pathname = '') {
  let host = 'http://localhost:8080';

  if (PROD) {
    host = 'https://www.napari-hub.org';
  }

  if (STAGING) {
    host = 'https://staging.napari-hub.org';
  }

  const url = new URL(pathname, host);
  return url;
}

export enum MetadataLabel {
  Version = 'version',
  ReleaseDate = 'releaseDate',
  License = 'license',
  PythonVersion = 'Python version',
  OperatingSystem = 'operating system',
}

/**
 * Creates a URL to the home page with query parameters if provided. Each query
 * parameter should be a tuple containing the key and value.
 *
 * @param params A list of query parameters.
 * @returns The search URL.
 */
export function getSearchUrl(...params: string[][]) {
  const url = getTestURL('/plugins');

  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  return url.href;
}

export function hasPageQueryParameter(page: Page, pageValue: number) {
  const url = new URL(page.url());
  return +(url.searchParams.get(SearchQueryParams.Page) ?? 0) === pageValue;
}

/**
 * @param name The query parameter to extract values from.
 * @returns A list of query parameter values.
 */
export function getQueryParameterValues(page: Page, name: string) {
  const url = new URL(page.url());
  return url.searchParams.getAll(name);
}

/**
 * Opens an accordion on the search page if the screen is small enough to render
 * an accordion.
 *
 * @param title The title of the accordion to open.
 */
export async function maybeOpenAccordion(
  page: Page,
  title: AccordionTitle,
  width = Infinity,
) {
  if (width < breakpoints['screen-875']) {
    await page.getByRole('button', { name: title }).click();
    await page.waitForTimeout(1000);
  }
}
