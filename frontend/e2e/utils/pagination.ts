import { expect, Page } from '@playwright/test';
import { selectors } from './_selectors';

export async function getResultNames(page: Page) {
  return page.locator(selectors.search.resultName).allInnerTexts();
}

export async function testResults({
  page,
  expectedPage,
  totalPages,
  results,
}: {
  page: Page;
  expectedPage: number;
  totalPages: number;
  results: string[];
}) {
  const names = await getResultNames(page);

  await expect(
    page.locator('[data-testid=paginationValue] span').first(),
  ).toContainText(String(expectedPage));
  await expect(
    page.locator('[data-testid=paginationValue] span').nth(2),
  ).toContainText(String(totalPages));

  expect(names).toEqual(results);
}
