import { test } from '@playwright/test';

import { searchPluginFixture } from '../utils/common';
import { filterPlugins, verifyFilterResults } from '../utils/filterNew';

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  test.only('should filter by supported data', async ({ page, viewport }) => {
    const sortBy = 'recentlyUpdated';
    const filterBy = {
      supported_data: ['2D', '3D'],
    };
    const filterCategory = ['Filter by category'];
    const fixtureData = searchPluginFixture(filterBy);
    await filterPlugins(
      page,
      filterBy,
      filterCategory,
      sortBy,
      viewport?.width,
    );

    //await verifyFilterResults(page, filterBy, fixtureData, sortBy);
  });
});
