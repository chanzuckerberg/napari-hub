/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { satisfies } from '@renovate/pep440';

import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchResultMetadata,
  getSearchUrl,
  maybeOpenAccordion,
  MetadataLabel,
} from './utils';

interface TestPluginFilterOptions {
  checkboxIds: string[];
  label: MetadataLabel;
  params: string[][];
  testMetadata(values: string[]): void;
}

async function testPluginFilter({
  checkboxIds,
  label,
  params,
  testMetadata,
}: TestPluginFilterOptions) {
  async function getCheckboxes() {
    return Promise.all(checkboxIds.map((id) => page.$(id)));
  }

  async function testResults() {
    const checkboxes = await getCheckboxes();

    // Check that the checkboxes are enabled
    await Promise.all(
      checkboxes.map(async (checkbox) => {
        const checked = await checkbox?.getAttribute('value');
        expect(checked).toBe('true');
      }),
    );

    const values = await getSearchResultMetadata(label);

    // Check that every plugin version passes the enabled filter.
    testMetadata(values);

    // Check query parameters
    for (const [key, value] of params) {
      expect(getQueryParameterValues(key)).toContain(value);
    }
  }

  async function testInitialLoad() {
    // Test filtering for initial load load
    await page.goto(getSearchUrl(...params));

    await testResults();
  }

  async function testCheckboxes() {
    await page.goto(getSearchUrl());
    await maybeOpenAccordion(AccordionTitle.FilterBy);

    const checkboxes = await getCheckboxes();
    await Promise.all(checkboxes.map((checkbox) => checkbox?.click()));

    await testResults();
  }

  await testInitialLoad();
  await testCheckboxes();
}

describe('Plugin Filters', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
  });

  it('should filter by python version', async () => {
    await testPluginFilter({
      checkboxIds: [
        '#checkbox-pythonVersions-3\\.7',
        '#checkbox-pythonVersions-3\\.8',
      ],
      label: MetadataLabel.PythonVersion,
      params: [
        ['python', '3.7'],
        ['python', '3.8'],
      ],
      testMetadata(versionSpecifiers: string[]) {
        // Check that every plugin version passes the enabled filter.
        versionSpecifiers.forEach((specifier) =>
          expect(
            satisfies('3.7', specifier) || satisfies('3.8', specifier),
          ).toBe(true),
        );
      },
    });
  });

  it('should filter by operating system', async () => {
    function hasLinux(operatingSystems: string[]) {
      return !!operatingSystems.find((os) => os.includes('Linux'));
    }

    await testPluginFilter({
      checkboxIds: ['#checkbox-operatingSystems-linux'],
      label: MetadataLabel.OperatingSystem,
      params: [['operatingSystem', 'linux']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).toBe(true);
      },
    });

    await testPluginFilter({
      checkboxIds: ['#checkbox-operatingSystems-mac'],
      label: MetadataLabel.OperatingSystem,
      params: [['operatingSystem', 'mac']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).not.toBe(true);
      },
    });
  });

  it('should filter by license', async () => {
    await testPluginFilter({
      checkboxIds: [],
      label: MetadataLabel.License,
      params: [],
      testMetadata(licenses) {
        expect(licenses).toContain('secret');
      },
    });

    await testPluginFilter({
      checkboxIds: ['#checkbox-license-openSource'],
      label: MetadataLabel.License,
      params: [['license', 'oss']],
      testMetadata(licenses) {
        expect(licenses).not.toContain('secret');
      },
    });
  });
});
