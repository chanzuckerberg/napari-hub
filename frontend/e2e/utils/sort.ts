import { expect, Page } from '@playwright/test';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import { selectors } from './selectors';
import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchUrl,
  maybeOpenAccordion,
  MetadataLabel,
} from './utils';

export async function clickOnRadio(page: Page, selector: string) {
  const radioInput = await page.$(selector);
  await radioInput?.click();

  // Wait for radio transition.
  await page.waitForTimeout(500);
}

export async function testPluginSort({
  page,
  sortType,
  preTestRadios,
  testResults,
  width,
}: {
  page: Page;
  sortType: SearchSortType;
  preTestRadios?(): Promise<void>;
  testResults(): Promise<void>;
  width?: number;
}) {
  async function testSortResults() {
    // Check that radio is selected.
    await expect(page.locator(selectors.sort.selected)).toHaveAttribute(
      'data-sort-type',
      sortType,
    );

    // Check that query parameter has been set.
    expect(getQueryParameterValues(page, SearchQueryParams.Sort)).toContain(
      sortType,
    );

    await testResults();
  }

  async function testInitialLoad() {
    await page.goto(getSearchUrl([SearchQueryParams.Sort, sortType]));
    await maybeOpenAccordion(page, AccordionTitle.Sort, width);
    await testSortResults();
  }

  async function testRadios() {
    await page.goto(getSearchUrl());
    await maybeOpenAccordion(page, AccordionTitle.Sort, width);
    await preTestRadios?.();
    await clickOnRadio(page, selectors.sort.getRadioInput(sortType));
    await testSortResults();
  }

  await testInitialLoad();
  await testRadios();
}
/**
 * Returns a list of search result metadata values given the name of the value.
 *
 * @param label The metadata label to fetch from.
 * @returns The list of metadata values.
 */
export async function getSearchResultMetadata(
  page: Page,
  label: MetadataLabel,
) {
  const result: string[] = [];

  const searchResultMetadata = await page.$$(
    '[data-testid=searchResultMetadata]',
  );

  // Collect all values for a particular metadata label.
  await Promise.all(
    searchResultMetadata.map(async (metadata) => {
      const resultLabel = await metadata.getAttribute('data-label');
      const value = await metadata.getAttribute('data-value');

      if (resultLabel === label && value) {
        result.push(value);
      }
    }),
  );
  return result;
}
