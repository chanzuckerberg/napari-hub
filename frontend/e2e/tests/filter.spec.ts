import { test } from '@playwright/test';

import { AUTHORS } from '../utils/constants';
import { filterPlugins, verifyFilterResults } from '../utils/filterNew';
import { searchPluginFixture } from '../utils/fixture';

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  TEST_AUTHORS.forEach(async (authors) => {
    test(`should filter by authors "${authors.toString()}"`, async ({
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
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
  [['reader'], ['widget', 'writer']].forEach(async (pluginTypes) => {
    test(`should filter by plugin plugin type "${pluginTypes.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Plugin type',
        name: 'pluginType',
        values: pluginTypes,
        category: ['Filter by requirement'],
        key: 'plugin_type',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
  [['3D'], ['2D', '3D']].forEach(async (supportedData) => {
    test(`should filter by ${supportedData.toString()}`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Supported data',
        name: 'supportedData',
        values: supportedData,
        category: ['Filter by requirement'],
        key: 'supported_data',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
  [['Medical imaging']].forEach(async (modality) => {
    test(`should filter by image modality "${modality.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Image modality',
        name: 'imageModality',
        values: modality,
        category: ['Filter by category'],
        key: 'image_modality',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
  [['Image registration']].forEach(async (workflowSteps) => {
    test.only(`should filter by workflow steps "${workflowSteps.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // sort by
      const sortBy = 'recentlyUpdated';

      // filter by
      const filterBy = {
        label: 'Workflow step',
        name: 'workflowStep',
        values: workflowSteps,
        category: ['Filter by category'],
        key: 'workflow_step',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      await verifyFilterResults(page, filterBy, fixtureData, sortBy);
    });
  });
});
