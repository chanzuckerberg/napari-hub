import { test } from '@playwright/test';

import { searchPluginFixture } from '../utils/common';
import { filterPlugins, verifyFilterResults } from '../utils/filterNew';

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  test.only('should filter by supported data', async ({ page, viewport }) => {
    // sort by
    const sortBy = 'recentlyUpdated';

    // filter by
    const filterBy = {
      label: 'Authors',
      name: 'authors',
      values: ['Allen Institute for Cell Science'],
      category: ['Filter by category'],
      key: 'authors',
    };
    // prepare fixture data to compare against
    const fixtureData = searchPluginFixture(filterBy, sortBy);
    await filterPlugins(page, filterBy, sortBy, viewport?.width);
    console.log(fixtureData);
    await verifyFilterResults(page, filterBy, fixtureData, sortBy);
  });
});
