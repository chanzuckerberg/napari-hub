import { test } from '@playwright/test';

import {
  AUTHORS,
  OPEN_EXTENSIONS,
  SAVE_EXTENSIONS,
} from '../../utils/constants';
import { filterPlugins, verifyFilterResults } from '../../utils/filter';
import { searchPluginFixture } from '../../utils/fixture';

export function compareDates(dateA: string, dateB: string): number {
  // time in ms makes newer dates have higher values
  return new Date(dateB).getTime() - new Date(dateA).getTime();
}

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];
const SAVE_FILE_EXTENSIONS = SAVE_EXTENSIONS[ENV.toUpperCase()];
const OPEN_FILE_EXTENSIONS = OPEN_EXTENSIONS[ENV.toUpperCase()];
const sortBy = 'Recently updated';
test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`);
  });
  TEST_AUTHORS.forEach((authors) => {
    test(`should filter by authors "${authors.toString()}"`, async ({
      page,
      viewport,
    }) => {
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
  [['writer'], ['widget', 'writer']].forEach((pluginTypes) => {
    test(`should filter by plugin type "${pluginTypes.toString()}"`, async ({
      page,
      viewport,
    }) => {
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
      const params = [['pluginType', pluginTypes]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  [['3D'], ['2D', '3D']].forEach((supportedData) => {
    test(`should filter by ${supportedData.toString()}`, async ({
      page,
      viewport,
    }) => {
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
      const params = [['supportedData', supportedData]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  [['Medical imaging']].forEach((modality) => {
    test(`should filter by image modality "${modality.toString()}"`, async ({
      page,
      viewport,
    }) => {
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
      const params = [['imageModality', modality]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  [['Image registration']].forEach((workflowSteps) => {
    test(`should filter by workflow steps "${workflowSteps.toString()}"`, async ({
      page,
      viewport,
    }) => {
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
      const params = [['workflowStep', workflowSteps]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });

  [['macOS'], ['macOS', 'Linux']].forEach((operatingSystem) => {
    test(`should filter by operating system "${operatingSystem.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      const filterBy = {
        label: 'Operating system',
        name: 'operatingSystem',
        values: operatingSystem,
        category: ['Filter by requirement'],
        key: 'operating_system',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      const osses = [];
      for (const os of operatingSystem) {
        osses.push(os.replace('macOS', 'mac').toLowerCase());
      }
      const params = [['operatingSystem', osses]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  [['Limit to plugins with open source license']].forEach((license) => {
    test(`should filter by license "${license.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      const filterBy = {
        label: 'License',
        name: 'license',
        values: license,
        category: ['Filter by requirement'],
        key: 'license',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      const params = [['license', license]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  [['3.6'], ['3.7', '3.9']].forEach((version) => {
    test(`should filter by python version "${version.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      const filterBy = {
        label: 'Python version',
        name: 'python',
        values: version,
        category: ['Filter by requirement'],
        key: 'python_version',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      const params = [['python', version]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  SAVE_FILE_EXTENSIONS.forEach((extension) => {
    test(`should filter by save extensions "${extension.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      const filterBy = {
        label: 'Save extension',
        name: 'writerFileExtensions',
        values: extension,
        category: ['Filter by requirement'],
        key: 'save_extension',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      const params = [['writerFileExtensions', extension]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
  OPEN_FILE_EXTENSIONS.forEach((extension) => {
    test(`should filter by open extensions "${extension.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      const filterBy = {
        label: 'Open extension',
        name: 'readerFileExtensions',
        values: extension,
        category: ['Filter by requirement'],
        key: 'open_extension',
      };
      // prepare fixture data to compare against
      const fixtureData = searchPluginFixture(filterBy, sortBy);
      await filterPlugins(page, filterBy, sortBy, viewport?.width);
      const params = [['readerFileExtensions', extension]];
      await verifyFilterResults(page, filterBy, fixtureData, params, sortBy);
    });
  });
});
