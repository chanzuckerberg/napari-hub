import { test } from '@playwright/test';

import {
  AUTHORS,
  OPEN_EXTENSIONS,
  SAVE_EXTENSIONS,
} from '../../utils/constants';
import { testPlugin } from '../../utils/plugin';

const ENV = (process.env.NODE_ENV as string) || '';
const TEST_AUTHORS = AUTHORS[ENV.toUpperCase()];
const SAVE_FILE_EXTENSIONS = SAVE_EXTENSIONS[ENV.toUpperCase()];
const OPEN_FILE_EXTENSIONS = OPEN_EXTENSIONS[ENV.toUpperCase()];
const sortBy = 'Recently updated';

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASEURL as string}`, { timeout: 60000 });
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

      const params = [['authors', authors]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
    });
  });
  [['writer'], ['widget', 'writer']].forEach((pluginTypes) => {
    test(`should filter by plugin type "${pluginTypes.toString()}"`, async ({
      page,
      viewport,
    }) => {
      // filter by
      // await page.pause();
      const filterBy = {
        label: 'Plugin type',
        name: 'pluginType',
        values: pluginTypes,
        category: ['Filter by requirement'],
        key: 'plugin_type',
      };
      const params = [['pluginType', pluginTypes]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['supportedData', supportedData]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['imageModality', modality]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['workflowStep', workflowSteps]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const osses = [];
      for (const os of operatingSystem) {
        osses.push(os.replace('macOS', 'mac').toLowerCase());
      }
      const params = [['operatingSystem', osses]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['license', license]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['python', version]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['writerFileExtensions', extension]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
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
      const params = [['readerFileExtensions', extension]];
      await testPlugin(page, filterBy, params, sortBy, viewport?.width);
    });
  });
});
