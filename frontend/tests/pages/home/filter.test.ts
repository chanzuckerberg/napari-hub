/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { satisfies } from '@renovate/pep440';

import {
  filterLinuxState,
  filterMacState,
  filterOnlyOpenSourcePluginsState,
  filterPython37State,
  filterPython38State,
  FilterStateType,
} from '@/store/search/filter.state';

import { FILTER_NAME_LABELS, FILTER_VALUE_LABELS } from './constants';
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
  states: FilterStateType[];
  testMetadata(values: string[]): void;
}

async function testPluginFilter({
  checkboxIds,
  label,
  states,
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
    states.forEach((state) =>
      expect(
        getQueryParameterValues(FILTER_NAME_LABELS.get(state) ?? ''),
      ).toContain(FILTER_VALUE_LABELS.get(state) ?? ''),
    );
  }

  async function testInitialLoad() {
    // Test filtering for initial load load
    await page.goto(
      getSearchUrl(
        ...states.map((state) => [
          FILTER_NAME_LABELS.get(state) ?? '',
          FILTER_VALUE_LABELS.get(state) ?? '',
        ]),
      ),
    );

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
      checkboxIds: ['#checkbox-3\\.7', '#checkbox-3\\.8'],
      label: MetadataLabel.PythonVersion,
      states: [filterPython37State, filterPython38State],
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
      checkboxIds: ['#checkbox-Linux'],
      label: MetadataLabel.OperatingSystem,
      states: [filterLinuxState],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).toBe(true);
      },
    });

    await testPluginFilter({
      checkboxIds: ['#checkbox-macOS'],
      label: MetadataLabel.OperatingSystem,
      states: [filterMacState],
      testMetadata(operatingSystems) {
        expect(hasLinux(operatingSystems)).not.toBe(true);
      },
    });
  });

  it('should filter by license', async () => {
    await testPluginFilter({
      checkboxIds: [],
      label: MetadataLabel.License,
      states: [],
      testMetadata(licenses) {
        expect(licenses).toContain('secret');
      },
    });

    await testPluginFilter({
      checkboxIds: [
        '#checkbox-Only\\ show\\ plugins\\ with\\ open\\ source\\ licenses',
      ],
      label: MetadataLabel.License,
      states: [filterOnlyOpenSourcePluginsState],
      testMetadata(licenses) {
        expect(licenses).not.toContain('secret');
      },
    });
  });
});
