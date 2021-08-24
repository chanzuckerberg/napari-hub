import { AxiosError } from 'axios';
import { Provider } from 'jotai';
import { debounce } from 'lodash';
import Head from 'next/head';
import { ReactNode, useEffect } from 'react';

import { hubAPI, spdxLicenseDataAPI } from '@/axios';
import { ErrorMessage } from '@/components/common';
import { PluginSearch } from '@/components/PluginSearch';
import { pluginIndexState } from '@/store/search/search.state';
import {
  getOsiApprovedLicenseSet,
  osiApprovedLicenseSetState,
  SpdxLicenseData,
  SpdxLicenseResponse,
} from '@/store/spdx';
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
          <Provider
            initialValues={[
              [osiApprovedLicenseSetState, getOsiApprovedLicenseSet(licenses)],
              [pluginIndexState, index],
            ]}
          >
            <PluginSearch />
          </Provider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
