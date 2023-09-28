import { Page, test } from '@playwright/test';

import { SearchSortType } from '@/store/search/constants';
import { PluginIndexData } from '@/types';

import { getResultsByName } from './dom';
import { getFixture } from './fixture';

async function sortPlugins({
  page,
  sortBy,
  width = 0,
}: {
  page: Page;
  sortBy: SearchSortType;
  width?: number;
}): Promise<void> {
  if (width < 875) {
    await page.locator('[data-title="SORT BY: Recently Updated"]').click();
  }

  if (sortBy !== SearchSortType.ReleaseDate) {
    if (width >= 875) {
      await page.locator('[data-testid=sortDropdown]').click();
    }

    await page.locator(`[data-sort-type="${sortBy}"]:visible`).click();
  }

  await page.keyboard.press('Escape');
}

export function testSort({
  name,
  sortBy,
  testPlugins,
}: {
  name: string;
  sortBy: SearchSortType;
  testPlugins(plugins: PluginIndexData[]): void;
}) {
  test(`should sort by ${name}`, async ({ page, viewport }) => {
    await sortPlugins({
      page,
      sortBy,
      width: viewport?.width,
    });

    const indexFixture = await getFixture<PluginIndexData[]>();

    const pluginMap = Object.fromEntries(
      indexFixture.map((plugin) => [plugin.name, plugin]),
    );

    const pluginNames = await getResultsByName(page);
    testPlugins(pluginNames.map((pluginName) => pluginMap[pluginName]));
  });
}
