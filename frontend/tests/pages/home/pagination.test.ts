/* eslint-disable jest/expect-expect */

import { SearchQueryParams, SearchSortType } from '@/store/search/constants';

import { getSearchResultNames, getSearchUrl } from './utils';

function hasPageQueryParameter(pageValue: number) {
  const url = new URL(page.url());
  return +(url.searchParams.get(SearchQueryParams.Page) ?? 0) === pageValue;
}

async function getResultNames() {
  const nameNodes = await getSearchResultNames();
  const names = await Promise.all(nameNodes.map((node) => node.textContent()));

  return names;
}

async function testResults({
  page: expectedPage,
  totalPages,
  results,
}: {
  page: number;
  totalPages: number;
  results: string[];
}) {
  const names = await getResultNames();

  await expect(
    await page.$('[data-testid=paginationValue] span:nth-child(1)'),
  ).toMatchText(String(expectedPage));
  await expect(
    await page.$('[data-testid=paginationValue] span:nth-child(3)'),
  ).toMatchText(String(totalPages));

  expect(names).toEqual(results);
}

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

describe('Plugin Pagination', () => {
  beforeEach(async () => {
    await jestPlaywright.resetPage();
  });

  it('should render full results in pages', async () => {
    await page.goto(getSearchUrl());
    await testResults({
      page: 1,
      totalPages: 3,
      results: RESULTS.PAGE_1_DEFAULT,
    });
  });

  it('should render filtered results in pages', async () => {
    const query = 'video';
    await page.goto(
      getSearchUrl(
        [SearchQueryParams.Search, query],
        [SearchQueryParams.Sort, SearchSortType.Relevance],
      ),
    );

    await testResults({
      page: 1,
      totalPages: 1,
      results: ['napari_video'],
    });
  });

  it('should update results when navigating pages', async () => {
    await page.goto(getSearchUrl());

    await page.click('[data-testid=paginationRight]');
    await testResults({
      page: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });

    await page.click('[data-testid=paginationRight]');
    await testResults({
      page: 3,
      totalPages: 3,
      results: RESULTS.PAGE_3_DEFAULT,
    });
    expect(hasPageQueryParameter(3)).toBe(true);

    await page.click('[data-testid=paginationLeft]');
    await page.click('[data-testid=paginationLeft]');
    await testResults({
      page: 1,
      totalPages: 3,
      results: RESULTS.PAGE_1_DEFAULT,
    });
    expect(hasPageQueryParameter(1)).toBe(true);
  });

  it('should update url with page parameter', async () => {
    await page.goto(getSearchUrl([SearchQueryParams.Page, '2']));
    await testResults({
      page: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });
  });

  it('should maintain page parameter when navigating back', async () => {
    await page.goto(getSearchUrl([SearchQueryParams.Page, '2']));

    await page.click('[data-testid=pluginSearchResult]');
    await page.waitForNavigation();
    await page.goBack();
    await page.waitForNavigation();
    await page.waitForTimeout(500);
    await testResults({
      page: 2,
      totalPages: 3,
      results: RESULTS.PAGE_2_DEFAULT,
    });
  });
});
