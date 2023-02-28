/* eslint-disable no-await-in-loop */
import { expect, Page } from '@playwright/test';

import { FilterKey, FilterType } from '@/store/search/search.store';

import { selectors } from './selectors';
import { getSearchResultMetadata } from './sort';
import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchUrl,
  maybeOpenAccordion,
  MetadataLabel,
} from './utils';

const FILTER_KEY_METADATA_LABEL_MAP: Partial<Record<FilterKey, MetadataLabel>> =
  {
    // TODO Fix tests since metadata has been removed from search result
    // license: MetadataLabel.License,
    // operatingSystems: MetadataLabel.OperatingSystem,
    // pythonVersion: MetadataLabel.PythonVersion,
  };

const CATEGORY_FILTERS = new Set<FilterKey>(['imageModality', 'workflowStep']);

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
