/* eslint-disable @typescript-eslint/no-non-null-assertion */

import dayjs from 'dayjs';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import {
  AccordionTitle,
  getQueryParameterValues,
  getSearchResultMetadata,
  getSearchUrl,
  maybeOpenAccordion,
  MetadataLabel,
} from './utils';

interface TestPluginSortOptions {
  sortType: SearchSortType;
  preTestRadios?(): Promise<void>;
  testResults(): Promise<void>;
}

async function clickOnRadio(selector: string) {
  const radioInput = await page.$(selector);
  await radioInput?.click();

  // Wait for radio transition.
  await page.waitForTimeout(500);
}

async function testPluginSort({
  sortType,
  preTestRadios,
  testResults,
}: TestPluginSortOptions) {
  async function testSortResults() {
    // Check that radio is selected.
    const radio = await page.$(`[data-testid=sortByRadio][data-selected=true]`);
    expect(await radio?.getAttribute('data-sort-type')).toBe(sortType);

    // Check that query parameter has been set.
    expect(getQueryParameterValues(SearchQueryParams.Sort)).toContain(sortType);

    await testResults();
  }

  async function testInitialLoad() {
    await page.goto(getSearchUrl([SearchQueryParams.Sort, sortType]));
    await testSortResults();
  }

  async function testRadios() {
    await page.goto(getSearchUrl());
    await maybeOpenAccordion(AccordionTitle.Sort);
    await preTestRadios?.();
    await clickOnRadio(`input[value=${sortType}]:visible`);
    await testSortResults();
  }

  await testInitialLoad();
  await testRadios();
}

describe('Plugin Sort', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
  });

  it('should sort by plugin name', async () => {
    await testPluginSort({
      sortType: SearchSortType.PluginName,

      async testResults() {
        const resultNames = await page.$$('[data-testid=searchResultName]');
        const names = await Promise.all(
          resultNames.map((result) => result.textContent()),
        );

        // Check that names are in ascending order.
        for (let i = 0; i < names.length - 1; i += 1) {
          const name1 = names[i]!;
          const name2 = names[i + 1]!;

          expect(name1.localeCompare(name2)).toBeLessThanOrEqual(0);
        }
      },
    });
  });

  it('should sort by recently updated', async () => {
    await testPluginSort({
      sortType: SearchSortType.ReleaseDate,

      async preTestRadios() {
        // Select different radio first because the `sort` parameter is not
        // populated on initial load.
        await clickOnRadio(
          `[data-testid=sortByRadio][data-sort-type=${SearchSortType.PluginName}]:visible`,
        );
      },

      async testResults() {
        const dates = await getSearchResultMetadata(MetadataLabel.ReleaseDate);

        for (let i = 0; i < dates.length - 1; i += 1) {
          const date1 = dayjs(dates[i]!);
          const date2 = dayjs(dates[i + 1]!);
          expect(date1.isAfter(date2) || date1.isSame(date2)).toBe(true);
        }
      },
    });
  });
});
