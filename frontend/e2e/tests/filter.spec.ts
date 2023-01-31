import { test } from '@playwright/test';

import { searchPluginFixture } from '../utils/fixture';
import { filterPlugins, verifyFilterResults } from '../utils/filterNew';
import { Console } from 'console';

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  test.only('should filter by supported data', async ({ page, viewport }) => {
    // sort by

    await page.pause();
    const sortBy = 'recentlyUpdated';

    // filter by
    const filterBy = {
      label: 'Authors',
      name: 'authors',
      values: ['Abigail McGovern'],
      category: ['Filter by category'],
      key: 'authors',
    };
    // prepare fixture data to compare against
    const fixtureData = searchPluginFixture(filterBy, sortBy);

    await filterPlugins(page, filterBy, sortBy, viewport?.width);

    // await verifyFilterResults(page, filterBy, fixtureData, sortBy);
  });

  test('should filter by plugin type', async ({ page, viewport }) => {
    // sort by

    await page.pause();
    const sortBy = 'recentlyUpdated';

    // filter by
    const filterBy = {
      label: 'Plugin type',
      name: 'pluginType',
      values: ['Reader'],
      category: ['Filter by requirement'],
      key: 'pluginType',
    };
    // prepare fixture data to compare against
    const fixtureData = searchPluginFixture(filterBy, sortBy);
    await filterPlugins(page, filterBy, sortBy, viewport?.width);

    // await verifyFilterResults(page, filterBy, fixtureData, sortBy);
  });
});
