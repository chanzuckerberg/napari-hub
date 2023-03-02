import { test } from '@playwright/test';

import { AUTHORS } from '../../utils/constants';
import { filterPlugins, verifyFilterResults } from '../../utils/filter';
import { searchPluginFixture } from '../../utils/fixture';

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];

test.describe('Sorting plugin tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  test(`should sort plugins by name`, async ({ page, viewport }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Plugin name';

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
    await filterPlugins(page, filterBy, sortBy, viewport?.width);
    const params = [['authors', authors]];
    await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
  });
  test(`should sort plugins by recently updated`, async ({
    page,
    viewport,
  }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Recently updated';

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
    await filterPlugins(page, filterBy, sortBy, viewport?.width);
    const params = [['authors', authors]];
    await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
  });
  test(`should sort plugins by newest`, async ({ page, viewport }) => {
    const authors = TEST_AUTHORS[0];
    // sort by
    const sortBy = 'Newest';

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
    await filterPlugins(page, filterBy, sortBy, viewport?.width);
    const params = [['authors', authors]];
    await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
  });
});
