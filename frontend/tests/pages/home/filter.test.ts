/* eslint-disable
  @typescript-eslint/no-non-null-assertion,
  no-await-in-loop,
*/

import { satisfies } from '@renovate/pep440';

import { FilterType } from '@/components/SearchPage/PluginFilterByForm';
import { FilterKey } from '@/store/search/search.store';

import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchResultMetadata,
  getSearchUrl,
  maybeOpenAccordion,
  MetadataLabel,
} from './utils';

interface TestPluginFilterOptions {
  options: string[];
  filterKey: FilterKey;
  params: string[][];
  testMetadata?(values: string[]): void;
}

const FILTER_KEY_METADATA_LABEL_MAP: Partial<Record<FilterKey, MetadataLabel>> =
  {
    // TODO Fix tests since metadata has been removed from search result
    // license: MetadataLabel.License,
    // operatingSystems: MetadataLabel.OperatingSystem,
    // pythonVersion: MetadataLabel.PythonVersion,
  };

const CATEGORY_FILTERS = new Set<FilterKey>(['imageModality', 'workflowStep']);

async function clickOnFilterButton(filterKey: FilterKey) {
  const filterButton = await page.$(
    `[data-testid=pluginFilter][data-filter=${filterKey}]`,
  );
  await filterButton?.click();
}

async function getOptions(labels: string[]) {
  const labelSet = new Set(labels);
  const optionNodes = await page.$$('[role=tooltip] [role=option]');

  interface OptionResult {
    label: string;
    node: typeof optionNodes[number];
    enabled: boolean;
  }

  const optionResults: OptionResult[] = [];

  for (const node of optionNodes) {
    const paragraphNode = await node.$('p');
    const label = await paragraphNode?.textContent();
    const ariaSelected = await node.getAttribute('aria-selected');
    if (label && labelSet.has(label)) {
      optionResults.push({
        label,
        node,
        enabled: ariaSelected === 'true',
      });
    }
  }

  return optionResults;
}

async function getChips(filterKey: FilterKey, labels: string[]) {
  const labelSet = new Set(labels);
  const chipNodes = await page.$$(`[data-filter=${filterKey}] .MuiChip-root`);
  const result: string[] = [];

  for (const node of chipNodes) {
    const labelNode = await node.$('.MuiChip-label');
    const label = await labelNode?.textContent();
    if (label && labelSet.has(label)) {
      result.push(label);
    }
  }

  return result;
}

async function testPluginFilter({
  options,
  filterKey,
  params,
  testMetadata,
}: TestPluginFilterOptions) {
  const isCategoryFilter = CATEGORY_FILTERS.has(filterKey);

  async function testResults() {
    const optionResults = await getOptions(options);

    // Check that filters are enabled.
    for (const { enabled } of optionResults) {
      expect(enabled).toBe(true);
    }

    const label = FILTER_KEY_METADATA_LABEL_MAP[filterKey];
    if (label) {
      const values = await getSearchResultMetadata(label);

      // Check that every plugin version passes the metadata test function.
      testMetadata?.(values);
    }

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

  async function openAccordion() {
    await maybeOpenAccordion(
      isCategoryFilter
        ? AccordionTitle.FilterByCategory
        : AccordionTitle.FilterByRequirement,
    );
  }

  async function testClickingOnOptions() {
    await page.goto(getSearchUrl());
    await openAccordion();
    await clickOnFilterButton(filterKey);

    for (let i = 0; i < options.length; i += 1) {
      const optionResults = await getOptions(options);
      const { node } =
        optionResults.find((result) => result.label === options[i]) ?? {};
      node?.click();
    }

    await clickOnFilterButton(filterKey);
    await testResults();
  }

  async function testClearAll() {
    await page.goto(getSearchUrl(...params));
    await openAccordion();
    let chipLabels = await getChips(filterKey, options);
    expect(chipLabels).toEqual(options);

    const filterType: FilterType = isCategoryFilter
      ? 'category'
      : 'requirement';
    await page.click(
      `[data-testid=clearAllButton][data-filter-type=${filterType}]`,
    );

    chipLabels = await getChips(filterKey, options);
    expect(chipLabels).toEqual([]);
  }

  await testInitialLoad();
  await testClickingOnOptions();
  await testClearAll();
}

describe('Plugin Filters', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
  });

  it('should filter by python version', async () => {
    await testPluginFilter({
      options: ['3.7', '3.8'],
      filterKey: 'pythonVersion',
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
      options: ['Linux'],
      filterKey: 'operatingSystems',
      params: [['operatingSystem', 'linux']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).toBe(true);
      },
    });

    await testPluginFilter({
      options: ['macOS'],
      filterKey: 'operatingSystems',
      params: [['operatingSystem', 'mac']],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).not.toBe(true);
      },
    });
  });

  it('should filter by license', async () => {
    await testPluginFilter({
      options: [],
      filterKey: 'license',
      params: [],
      testMetadata(licenses) {
        expect(licenses).toContain('secret');
      },
    });

    await testPluginFilter({
      options: ['Limit to plugins with open source license'],
      filterKey: 'license',
      params: [['license', 'oss']],
      testMetadata(licenses) {
        expect(licenses).not.toContain('secret');
      },
    });
  });

  // eslint-disable-next-line jest/expect-expect
  it('should filter by workflow step', async () => {
    const options = ['Image registration', 'Pixel classification'];

    await testPluginFilter({
      options,
      filterKey: 'workflowStep',
      params: [
        ['workflowStep', options[0]],
        ['workflowStep', options[1]],
      ],
    });
  });

  // eslint-disable-next-line jest/expect-expect
  it('should filter by image modality', async () => {
    const options = ['Medical imaging', 'Multi-photon microscopy'];

    await testPluginFilter({
      options,
      filterKey: 'imageModality',
      params: [
        ['imageModality', options[0]],
        ['imageModality', options[1]],
      ],
    });
  });

  // eslint-disable-next-line jest/expect-expect
  it('should filter by supported data', async () => {
    const options = ['2D', '3D'];

    await testPluginFilter({
      options,
      filterKey: 'supportedData',
      params: [
        ['supportedData', options[0]],
        ['supportedData', options[1]],
      ],
    });
  });
});
