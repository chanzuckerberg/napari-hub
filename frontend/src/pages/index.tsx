import { AxiosError } from 'axios';
import { debounce } from 'lodash';
import Head from 'next/head';
import { ReactNode, useEffect } from 'react';

import { hubAPI, spdxLicenseDataAPI } from '@/axios';
import { ErrorMessage } from '@/components/common';
import { PluginSearch } from '@/components/PluginSearch';
import {
  initOsiApprovedLicenseSet,
  initSearchEngine,
} from '@/store/search/form.store';
import { initQueryParameterListener } from '@/store/search/queryParameters';
import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';
import { PluginIndexData } from '@/types';
import { setSearchScrollY } from '@/utils/search';

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
  useEffect(() => {
    function scrollHandler() {
      setSearchScrollY(window.scrollY);
    }

    // Debounce scroll handler so that we don't overrun the main thread with
    // `localStorage.set()` calls.
    const debouncedScrollHandler = debounce(scrollHandler, 300);

    document.addEventListener('scroll', debouncedScrollHandler);
    return () => document.removeEventListener('scroll', debouncedScrollHandler);
  }, []);

  useEffect(() => {
    if (index) {
      initSearchEngine(index);
    }

    if (licenses) {
      initOsiApprovedLicenseSet(licenses);
    }

    const unsubscribe = initQueryParameterListener();
    return unsubscribe;
  }, [index, licenses]);

  return (
    <>
      <Head>
        <title>napari hub | Search</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>Unable to fetch plugin index</ErrorMessage>
      ) : (
        index && licenses && <PluginSearch />
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
