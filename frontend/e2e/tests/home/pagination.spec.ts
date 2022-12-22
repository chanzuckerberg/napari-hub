import { expect, test } from '@playwright/test';

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import { testResults } from '../../utils/pagination';
import { getSearchUrl, hasPageQueryParameter } from '../../utils/utils';

const RESULTS = {
  PAGE_1_DEFAULT: [
    // Display name
    // TODO add tests specifically for display name
    'Test Plugin',
    'napari-animation',
    'PlatyMatch',
    'cellpose-napari',
    'napari-minimal-plugin',
    'napari-svg',
    'napari-itk-io',
    'napari-properties-viewer',
    'cellfinder-napari',
    'napari-demo',
    'brainreg-segment',
    'napari-medical-image-formats',
    'ome-zarr',
    'napari-yapic-prediction',
    'napari-czifile2',
  ],

  PAGE_2_DEFAULT: [
    'PartSeg',
    'elastix-napari',
    'misic-napari-plugin',
    'napari-hdf5-labels-io',
    'napari-dzi-zarr',
    'affinder',
    'napari-mri',
    'napari_video',
    'napping',
    'napari-imc',
    'brainglobe-napari-io',
    'napari-compressed-labels-io',
    'napari-em-reader',
    'napari-console',
    'nd2-dask',
  ],

  PAGE_3_DEFAULT: [
    'napari-nikon-nd2',
    'napari-lazy-openslide',
    'napari-dv',
    'napari-cellfinder',
    'napari-aicsimageio',
    'napari-brainreg',
    'napari-btrack-reader',
  ],
};

test.describe('Plugin Pagination', () => {
  test('should render full results in pages', async ({ page }) => {
    await page.goto(getSearchUrl());
    await testResults({
      page,
      expectedPage: 1,
      totalPages: 3,
      results: RESULTS.PAGE_1_DEFAULT,
    });
  });

  test('should render filtered results in pages', async ({ page }) => {
    const query = 'video';
    await page.goto(
      getSearchUrl(
        [SearchQueryParams.Search, query],
        [SearchQueryParams.Sort, SearchSortType.Relevance],
      ),
    );

    await testResults({
      page,
      expectedPage: 1,
      totalPages: 1,
      results: ['napari_video'],
    });
  });

  test('should update results when navigating pages', async ({ page }) => {
    await page.goto(getSearchUrl());

    await page.click('[data-testid=paginationRight]');
    await testResults({
      page,
      expectedPage: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });

    await page.click('[data-testid=paginationRight]');
    await testResults({
      page,
      expectedPage: 3,
      totalPages: 3,
      results: RESULTS.PAGE_3_DEFAULT,
    });
    expect(hasPageQueryParameter(page, 3)).toBe(true);

    await page.click('[data-testid=paginationLeft]');
    await page.click('[data-testid=paginationLeft]');
    await testResults({
      page,
      expectedPage: 1,
      totalPages: 3,
      results: RESULTS.PAGE_1_DEFAULT,
    });
    expect(hasPageQueryParameter(page, 1)).toBe(true);
  });

  test('should update url with page parameter', async ({ page }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Page, '2']));
    await testResults({
      page,
      expectedPage: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });
  });

  test('should maintain page parameter when navigating back', async ({
    page,
  }) => {
    await page.goto(getSearchUrl([SearchQueryParams.Page, '2']));

    await page.click('[data-testid=pluginSearchResult]');
    await page.waitForNavigation();
    await page.goBack();
    await page.waitForNavigation();
    await page.waitForTimeout(500);
    await testResults({
      page,
      expectedPage: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });
  });
});
