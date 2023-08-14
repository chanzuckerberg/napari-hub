import { Page } from '@playwright/test';

import { selectors } from './selectors';
import { getSearchUrl } from './utils';

export async function openSearchPageWithQuery(
  page: Page,
  query: string,
): Promise<void> {
  const selector = selectors.search.searchInput;
  await page.goto(getSearchUrl());
  await page.fill(selector, query);
  await page.press(selector, 'Enter');
}
