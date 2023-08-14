import { Page } from '@playwright/test';

import { selectors } from './selectors';

export async function getResultsByName(page: Page): Promise<string[]> {
  const resultNodes = await page.$$(selectors.search.resultName);
  const names = await Promise.all(
    resultNodes.map((node) => node.textContent()),
  );

  return names.filter((name): name is string => !!name);
}
