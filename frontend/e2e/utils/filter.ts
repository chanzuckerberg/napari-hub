/* eslint-disable no-await-in-loop */

import { expect, Page, test } from '@playwright/test';
import _ from 'lodash';

import { FilterKey } from '@/store/search/search.store';
import { PluginIndexData } from '@/types';

import { AccordionTitle } from '../types/filter';
import { getResultsByName } from './dom';
import { getFixture } from './fixture';
import { selectors } from './selectors';

const OPTION_NAME_MAP: Record<string, string | undefined> = {
  oss: 'Limit to plugins with open source license',
};

function getFormattedOption(option: string): string {
  return OPTION_NAME_MAP[option] ?? option;
}

async function filterPlugins<T extends FilterKey>({
  filter,
  page,
  values,
  width = 0,
}: {
  page: Page;
  accordion: AccordionTitle;
  filter: T;
  values: string[];
  width?: number;
}): Promise<void> {
  // sorting order

  if (width < 875) {
    await page.locator('[data-title="Filter by category"]').click();
    await page.locator('[data-title="Filter by requirement"]').click();
  }

  // select filter dropdown options
  await page.click(selectors.filters.getFilterButton(filter));

  // get option values
  await Promise.all(
    values.map((value) =>
      page.click(
        selectors.filters.getFilterOption(filter, getFormattedOption(value)),
      ),
    ),
  );

  await page.keyboard.press('Escape');
}

export function testFilters({
  accordion,
  filterKey,
  metadataKey,
  name,
  only,
  testPlugin = (currentValues, plugin) => {
    expect(
      _.intersection(currentValues, _.get(plugin, metadataKey) as unknown[])
        .length,
    ).toBeGreaterThan(0);
  },
  values,
}: {
  accordion: AccordionTitle;
  filterKey: FilterKey;
  metadataKey: string;
  name: string;
  only?: boolean;
  testPlugin?(values: string[], plugin: PluginIndexData): void | Promise<void>;
  values: string[];
}) {
  const testFn = only ? test.only : test;

  testFn(`should filter by ${name}`, async ({ page, viewport }) => {
    await filterPlugins({
      page,
      values,
      accordion,
      filter: filterKey,
      width: viewport?.width,
    });

    const indexFixture = await getFixture<PluginIndexData[]>();

    const pluginMap = Object.fromEntries(
      indexFixture.map((plugin) => [plugin.name, plugin]),
    );

    const pluginNames = await getResultsByName(page);
    await Promise.all(
      pluginNames.map((pluginName) => {
        if (!pluginMap[pluginName]) {
          throw new Error(`Plugin not found in fixture: ${pluginName}`);
        }

        return testPlugin(values, pluginMap[pluginName]);
      }),
    );
  });
}
