import { expect, test } from '@playwright/test';
import { satisfies } from '@renovate/pep440';
import _ from 'lodash';

import { AccordionTitle } from '@/e2e/types/filter';
import { testFilters } from '@/e2e/utils/filter';
import { getFixture } from '@/e2e/utils/fixture';
import { getTestURL } from '@/e2e/utils/utils';
import { SpdxLicenseData } from '@/store/search/types';

test.describe('Plugin filter tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getTestURL('/plugins').href, {
      timeout: 60000,
    });
  });

  testFilters({
    name: 'workflow step',
    accordion: AccordionTitle.FilterByCategory,
    filterKey: 'workflowStep',
    metadataKey: 'category["Workflow step"]',
    values: ['Image reconstruction', 'Image registration'],
  });

  testFilters({
    name: 'image modality',
    accordion: AccordionTitle.FilterByCategory,
    filterKey: 'imageModality',
    metadataKey: 'category["Image modality"]',
    values: ['Medical imaging', 'Bright-field microscopy'],
  });

  testFilters({
    name: 'supported data',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'supportedData',
    metadataKey: 'category["Supported data"]',
    values: ['2D', '3D'],
  });

  testFilters({
    name: 'plugin type',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'pluginType',
    metadataKey: 'plugin_types',
    values: ['reader', 'writer'],
  });

  testFilters({
    name: 'save extension',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'writerFileExtensions',
    metadataKey: 'writer_file_extensions',
    values: ['.zarr'],
  });

  testFilters({
    name: 'open extension',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'readerFileExtensions',
    metadataKey: 'reader_file_extensions',
    values: ['*.npy'],
  });

  testFilters({
    name: 'authors',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'authors',
    metadataKey: 'reader_file_extensions',
    values: ['Nicholas Sofroniew'],

    testPlugin(values, plugin) {
      expect(
        _.intersection(
          values,
          plugin.authors.map((author) => author.name),
        ).length,
      ).toBeGreaterThan(0);
    },
  });

  testFilters({
    name: 'operating system',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'operatingSystems',
    metadataKey: 'operating_system',
    values: ['macOS', 'Linux'],

    testPlugin(values, plugin) {
      const patternMap: Record<string, RegExp> = {
        Linux: /Linux/,
        macOS: /MacOS/,
      };

      expect(
        plugin.operating_system.some((os) => os.includes('OS Independent')) ||
          values.some((value) =>
            plugin.operating_system.some((os) => patternMap[value].exec(os)),
          ),
      ).toBe(true);
    },
  });

  testFilters({
    name: 'python version',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'pythonVersion',
    metadataKey: 'python_version',
    values: ['3.8'],

    testPlugin(values, plugin) {
      expect(
        values.some((value) => satisfies(value, plugin.python_version)),
      ).toBe(true);
    },
  });

  testFilters({
    name: 'open source licenses',
    accordion: AccordionTitle.FilterByRequirement,
    filterKey: 'license',
    metadataKey: 'license',
    values: ['Limit to plugins with open source license'],

    async testPlugin(_values, plugin) {
      const licenseFixture = await getFixture<SpdxLicenseData[]>(
        'osi-licenses',
      );

      const ossLicenses = new Set(
        licenseFixture
          .filter((license) => license.isOsiApproved)
          .map((license) => license.licenseId),
      );

      expect(ossLicenses).toContain(plugin.license);
    },
  });
});
