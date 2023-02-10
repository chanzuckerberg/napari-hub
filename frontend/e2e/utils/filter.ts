/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-await-in-loop */
import { expect, Page } from '@playwright/test';

import { PluginFilter } from '../types/filter';
import {
  PAGINATION_LEFT,
  PAGINATION_RIGHT,
  PAGINATION_VALUE,
  SEARCH_RESULT,
} from './constants';
import { parseItem } from './fixture';
import { verifyPlugin } from './plugin';
import { getByHasText, getByTestID, selectors } from './selectors';
import {
  AccordionTitle,
  getQueryParameterValues,
  maybeOpenAccordion,
} from './utils';

const totalPerPage = 15;

const sortOrders: Record<string, string> = {
  'Recently updated': 'recentlyUpdated',
  'Plugin name': 'pluginName',
  Newest: 'newest',
};

/**
 * Opens the accordion for the chosen filter type on smaller screens
 * @param page
 * @param filterKey
 * @param width
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function openAccordion(
  page: Page,
  filterTypes: Array<string>,
  width?: number,
) {
  const CATEGORY_FILTER_TYPE = 'Filter by category';
  filterTypes.forEach(async (filterType) => {
    const title =
      filterType === CATEGORY_FILTER_TYPE
        ? AccordionTitle.FilterByCategory
        : AccordionTitle.FilterByRequirement;
    await maybeOpenAccordion(page, title, width);
  });
}

export async function filterPlugins(
  page: Page,
  pluginFilter: PluginFilter,
  sortBy = 'Recently updated',
  width?: number,
): Promise<void> {
  // sorting order
  await page.getByRole('radio', { name: sortBy }).check();

  // on smaller screens the filter types are collapsed, so first click the accordion
  await openAccordion(page, pluginFilter.category, width);

  // select filter dropdown options
  await page.getByRole('button', { name: pluginFilter.label }).click();

  // get option values
  const { label, values } = pluginFilter;
  for (let i = 0; i < values.length; i += 1) {
    const option = values[i];
    await page
      .getByRole('option', { name: `unchecked checkbox ${option}` })
      .getByText(`${option}`)
      .click();
  }

  // close the filter dropdown
  await page.getByRole('button', { name: label }).click();
}

export async function getOptions(page: Page, labels: string[]) {
  const labelSet = new Set(labels);
  const optionNodes = await page.$$(selectors.filters.options);

  interface OptionResult {
    label: string;
    node: typeof optionNodes[number];
    enabled: boolean;
  }

  const optionResults: OptionResult[] = [];

  for (const node of optionNodes) {
    const paragraphNode = await node.$('p');
    const label = await paragraphNode?.textContent();
    const ariaSelected = await node.getAttribute('aria-selected');
    if (label && labelSet.has(label)) {
      optionResults.push({
        label,
        node,
        enabled: ariaSelected === 'true',
      });
    }
  }

  return optionResults;
}

export async function verifyFilterResults(
  page: Page,
  pluginFilter: PluginFilter,
  expectedData: any,
  params: string | (string | string[])[][],
  sortBy = 'Recently updated',
) {
  let currentPageCounter = 1;
  const expectedTotalPages = Math.floor(expectedData.length / totalPerPage) + 1;
  // Check that filters are enabled
  const filterOptions = pluginFilter.values;
  filterOptions?.forEach(async (option) => {
    await expect(
      page.getByRole('button', { name: `${option}` }).first(),
    ).toBeVisible();
  });

  for (let pageNumber = 1; pageNumber <= expectedTotalPages; pageNumber += 1) {
    // current page
    const pagination = page.locator(getByTestID(PAGINATION_VALUE));
    const currentPageValue = await pagination
      .locator('span')
      .nth(0)
      .textContent();
    expect(Number(currentPageValue)).toBe(currentPageCounter);

    // verify url
    expect(page.url()).toContain(`page=${currentPageValue as string}`);
    expect(page.url()).toContain(`sort=${sortOrders[sortBy]}`);
    for (const [key, value] of params) {
      const expected = getQueryParameterValues(page, key as string);
      const diff = expected.filter((x) => !value.includes(x));
      expect(diff.length).toBe(0);
    }

    // verify results counts
    const resultCountText =
      (await page
        .locator(getByHasText('h3', 'Browse plugins:'))
        .textContent()) || '';

    const resultCountValue = Number(resultCountText.trim().replace(/\D/g, ''));

    // result count
    expect(resultCountValue).toBe(expectedData.length);

    // total pages
    const actualTotalPages = Math.floor(resultCountValue / totalPerPage) + 1;
    expect(actualTotalPages).toBe(expectedTotalPages);

    // validate each plugin details on current page
    let i = 0;
    for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
      const dataIndex = (pageNumber - 1) * 15 + i;
      const data = parseItem(expectedData[dataIndex]);
      await verifyPlugin(plugin, data);
      // increment counter
      i += 1;
    }

    // paginate
    if (currentPageCounter === 1) {
      await expect(page.locator(getByTestID(PAGINATION_LEFT))).toBeDisabled();
      if (expectedTotalPages > 1) {
        await expect(page.locator(getByTestID(PAGINATION_RIGHT))).toBeVisible();
      }
    }
    if (currentPageCounter === expectedTotalPages) {
      await expect(page.locator(getByTestID(PAGINATION_RIGHT))).toBeDisabled();
      if (expectedTotalPages > 1) {
        await expect(page.locator(getByTestID(PAGINATION_LEFT))).toBeVisible();
      }
    }
    if (currentPageCounter < expectedTotalPages && expectedTotalPages >= 2) {
      await page.locator(getByTestID(PAGINATION_RIGHT)).click();
    }
    currentPageCounter += 1;
  }
}
