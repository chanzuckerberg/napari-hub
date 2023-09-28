import { expect, test } from '@playwright/test';

import { testSort } from '@/e2e/utils/sort';
import { getTestURL } from '@/e2e/utils/utils';
import { SearchSortType } from '@/store/search/constants';

function dateCompare(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}

test.describe('Plugin sorting tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(getTestURL('/plugins').href, {
      timeout: 60000,
    });
  });

  testSort({
    name: 'name',
    sortBy: SearchSortType.PluginName,

    testPlugins(plugins) {
      expect(plugins).toEqual(
        plugins.sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
  });

  testSort({
    name: 'recently updated',
    sortBy: SearchSortType.ReleaseDate,

    testPlugins(plugins) {
      expect(plugins).toEqual(
        plugins.sort((a, b) => dateCompare(a.release_date, b.release_date)),
      );
    },
  });

  testSort({
    name: 'newest',
    sortBy: SearchSortType.FirstReleased,

    testPlugins(plugins) {
      expect(plugins).toEqual(
        plugins.sort((a, b) => dateCompare(a.first_released, b.first_released)),
      );
    },
  });
});
