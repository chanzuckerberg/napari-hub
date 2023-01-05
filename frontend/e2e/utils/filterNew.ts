import { expect, Page } from '@playwright/test';
import { PluginFilter } from 'e2e/types/filter';

import { FilterKey, FilterType } from '@/store/search/search.store';

import { selectors } from './_selectors';
import { getByHasText, getByTestID, getByText, getHasText } from './selectors';
import { getSearchResultMetadata } from './sort';
import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchUrl,
  maybeOpenAccordion,
} from './utils';
import {
  DISPLAY_NAME,
  PLUGIN_SEARCH_RESULT,
  RESULT_AUTHORS,
  RESULT_NAME,
  RESULT_SUMMARY,
  SEARCH_RESULT,
} from './constants';

const CATEGORY_FILTERS = new Set<FilterKey>(['imageModality', 'workflowStep']);
const totalPerPage = 15;
export async function filterPlugins(
  page: Page,
  pluginFilter: PluginFilter,
  filterTypes: Array<string>,
  width?: number,
) {
  // on smaller screens the filter types are collapsed, so first click the accordion
  await openAccordion(page, filterTypes, width);

  Object.keys(pluginFilter).forEach(async (filterKey) => {
    // select filter
    await clickOnFilterButton(page, filterKey as FilterKey);
    // select filter options
    const filterOptions = pluginFilter[filterKey as keyof PluginFilter];
    filterOptions?.forEach(async (option) => {
      await page.locator(getByText(option)).click();
    });
  });
}

export async function clickOnFilterButton(page: Page, filterKey: FilterKey) {
  await page.click(selectors.filters.getFilterButton(filterKey));
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

export async function getChips(
  page: Page,
  filterKey: FilterKey,
  labels: string[],
) {
  const labelSet = new Set(labels);
  const chipNodes = await page.$$(selectors.filters.getChips(filterKey));
  const result: string[] = [];

  for (const node of chipNodes) {
    const labelNode = await node.$(selectors.filters.chipLabel);
    const label = await labelNode?.textContent();
    if (label && labelSet.has(label)) {
      result.push(label);
    }
  }

  return result;
}

/**
 * Opens the accordion for the chosen filter type on smaller screens
 * @param page
 * @param filterKey
 * @param width
 */
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

export async function verifyFilterResults(
  page: Page,
  pluginFilter: PluginFilter,
  fixture: any,
) {
  const expectedTotalPages = fixture.length / totalPerPage + 1;

  // Check that filters are enabled
  Object.keys(pluginFilter).forEach(async (filterKey) => {
    const filterOptions = pluginFilter[filterKey as keyof PluginFilter];
    filterOptions?.forEach(async (option) => {
      expect(
        await page.locator(getByText(option)).getAttribute('aria-selected'),
      ).toBe(true);
    });
  });

  // verify results counts
  const resultCountText =
    (await page.locator(getByHasText('h3', 'Browse plugins:')).textContent()) ||
    '';
  const resultCountValue = Number(resultCountText.trim().replace(/\D/g, ''));
  expect(resultCountValue).toBe(fixture.length);

  // total pages
  const actualTotalPages = resultCountValue / totalPerPage + 1;
  expect(actualTotalPages).toBe(expectedTotalPages);

  // validate each plugin details
  let i = 0;
  for (const plugin of await page.locator(getByTestID(SEARCH_RESULT)).all()) {
    // for (let i = 0; i < actualTotalPages; i++) {
    // plugin display name
    expect(await plugin.locator(getByTestID(DISPLAY_NAME)).textContent()).toBe(
      fixture[i].display_name,
    );

    // plugin name
    // todo: uncomment after new test id gets deployed to the environment
    expect(await plugin.locator(getByTestID(RESULT_NAME)).textContent()).toBe(
      fixture[i].name,
    );

    // plugin summary
    expect(
      await plugin.locator(getByTestID(RESULT_SUMMARY)).textContent(),
    ).toBe(fixture[i].summary);

    // plugin authors
    for (
      let j = 0;
      j < (await plugin.locator(getByTestID(RESULT_AUTHORS)).count());
      j++
    ) {
      const author = fixture[i].authors[j].name;
      expect(
        await plugin.locator(getByTestID(RESULT_AUTHORS)).nth(j).textContent(),
      ).toBe(author);
    }

    i++;
  }

  const label = FILTER_KEY_METADATA_LABEL_MAP[filterKey];
  if (label) {
    const values = await getSearchResultMetadata(page, label);

    // Check that every plugin version passes the metadata test function.
    testMetadata?.(values);
  }

  // Check query parameters
  for (const [key, value] of params) {
    expect(getQueryParameterValues(page, key)).toContain(value);
  }
}
export async function testPluginFilter({
  page,
  width,
  options,
  filterKey,
  params,
  testMetadata,
}: {
  page: Page;
  width?: number;
  options: string[];
  filterKey: FilterKey;
  params: string[][];
  testMetadata?(values: string[]): void;
}) {
  const isCategoryFilter = CATEGORY_FILTERS.has(filterKey);

  async function openAccordion() {
    const title = isCategoryFilter
      ? AccordionTitle.FilterByCategory
      : AccordionTitle.FilterByRequirement;

    await maybeOpenAccordion(page, title, width);
  }

  async function testResults() {
    const optionResults = await getOptions(page, options);

    // Check that filters are enabled.
    for (const { enabled } of optionResults) {
      expect(enabled).toBe(true);
    }

    const label = FILTER_KEY_METADATA_LABEL_MAP[filterKey];
    if (label) {
      const values = await getSearchResultMetadata(page, label);

      // Check that every plugin version passes the metadata test function.
      testMetadata?.(values);
    }

    // Check query parameters
    for (const [key, value] of params) {
      expect(getQueryParameterValues(page, key)).toContain(value);
    }
  }

  async function testInitialLoad() {
    // Test filtering for initial load load
    await page.goto(getSearchUrl(...params));
    await openAccordion();
    await testResults();
  }

  async function testClickingOnOptions() {
    await page.goto(getSearchUrl());
    await openAccordion();
    await clickOnFilterButton(page, filterKey);

    for (let i = 0; i < options.length; i += 1) {
      const optionResults = await getOptions(page, options);
      const { node } =
        optionResults.find((result) => result.label === options[i]) ?? {};
      await node?.click();
    }

    await clickOnFilterButton(page, filterKey);
    await testResults();
  }

  async function testClearAll() {
    await page.goto(getSearchUrl(...params));
    await openAccordion();
    await page.waitForTimeout(500);
    let chipLabels = await getChips(page, filterKey, options);
    expect(chipLabels).toEqual(options);

    const filterType: FilterType = isCategoryFilter
      ? 'category'
      : 'requirement';
    await page.click(selectors.filters.getClearAllButton(filterType));

    chipLabels = await getChips(page, filterKey, options);
    expect(chipLabels).toEqual([]);
  }

  await testInitialLoad();
  await testClickingOnOptions();
  await testClearAll();
}
