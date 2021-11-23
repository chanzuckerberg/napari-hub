import { AxiosError } from 'axios';
import { over } from 'lodash';
import Head from 'next/head';
import { ReactNode, useEffect } from 'react';

import { hubAPI, spdxLicenseDataAPI } from '@/axios';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { PluginSearch } from '@/components/PluginSearch';
import { FilterDataProvider } from '@/context/filter';
import { useLoadingState } from '@/context/loading';
import {
  initCategoryFilters,
  initOsiApprovedLicenseSet,
  initPageResetListener,
  initSearchEngine,
} from '@/store/search/form.store';
import { initQueryParameterListener } from '@/store/search/queryParameters';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import { PluginIndexData } from '@/types';

interface Props {
  licenses?: SpdxLicenseData[];
  index?: PluginIndexData[];
  error?: string;
}

export async function getServerSideProps() {
  const url = '/plugins/index';
  const props: Props = {};

  try {
    const { data: index } = await hubAPI.get<PluginIndexData[]>(url);
    const {
      data: { licenses },
    } = await spdxLicenseDataAPI.get<SpdxLicenseResponse>('');

    Object.assign(props, { index, licenses });
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

export default function Home({ error, index, licenses }: Props) {
  const isLoading = useLoadingState();
  useEffect(() => {
    // Skip indexing while the search page is loading.
    if (isLoading) {
      return () => {};
    }

    if (index) {
      initSearchEngine(index);
      initCategoryFilters(index);
    }

    if (licenses) {
      initOsiApprovedLicenseSet(licenses);
    }

    const unsubscribe = over([
      initQueryParameterListener(),
      initPageResetListener(),
    ]);

    return unsubscribe as () => void;
  }, [index, isLoading, licenses]);

  return (
    <>
      <Head>
        <title>napari hub | Search</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>Unable to fetch plugin index</ErrorMessage>
      ) : (
        index &&
        licenses && (
          <FilterDataProvider index={index}>
            <PluginSearch />
          </FilterDataProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
