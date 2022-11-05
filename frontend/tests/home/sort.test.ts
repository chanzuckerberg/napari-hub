/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect, test } from '@playwright/test';
import dayjs from 'dayjs';

import { SearchSortType } from '@/store/search/constants';
import { selectors } from '@/tests/selectors';
import { MetadataLabel } from '@/tests/utils';

import {
  clickOnRadio,
  getSearchResultMetadata,
  testPluginSort,
} from './sort.utils';

test.describe('Plugin Sort', () => {
  test('should sort by plugin name', async ({ page, viewport }) => {
    await testPluginSort({
      page,
      width: viewport?.width,
      sortType: SearchSortType.PluginName,

      async testResults() {
        const resultNames = await page.$$(selectors.search.resultName);
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

  test('should sort by recently updated', async ({ page, viewport }) => {
    await testPluginSort({
      page,
      width: viewport?.width,
      sortType: SearchSortType.ReleaseDate,

      async preTestRadios() {
        // Select different radio first because the `sort` parameter is not
        // populated on initial load.
        await clickOnRadio(
          page,
          selectors.sort.getRadio(SearchSortType.PluginName),
        );
      },

      async testResults() {
        const dates = await getSearchResultMetadata(
          page,
          MetadataLabel.ReleaseDate,
        );

        for (let i = 0; i < dates.length - 1; i += 1) {
          const date1 = dayjs(dates[i]!);
          const date2 = dayjs(dates[i + 1]!);
          expect(date1.isAfter(date2) || date1.isSame(date2)).toBe(true);
        }
      },
    });
  });
});
