import { test } from '@playwright/test';

import { AUTHORS, PLUGIN_TYPE } from '../utils/constants';
import { filterPlugins, verifyFilterResults } from '../utils/filterNew';
import { searchPluginFixture } from '../utils/fixture';

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];
const TEST_PLUGIN_TYPE = PLUGIN_TYPE[ENV.toUpperCase()];

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  TEST_AUTHORS.forEach(async (authors) => {
    test.only(`should filter by authors ${authors.toString()}`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Authors',
        name: 'authors',
        values: authors,
        category: ['Filter by category'],
        key: 'authors',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      // console.log(fixtureData);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });

  TEST_PLUGIN_TYPE.forEach(async (plugin) => {
    test.only(`should filter by authors ${plugin.toString()}`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Authors',
        name: 'authors',
        values: authors,
        category: ['Filter by category'],
        key: 'authors',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      // console.log(fixtureData);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
});
