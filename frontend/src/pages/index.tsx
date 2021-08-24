import { AxiosError } from 'axios';
import { useAtom } from 'jotai';
import { debounce } from 'lodash';
import Head from 'next/head';
import { ReactNode, useEffect } from 'react';

import { hubAPI, spdxLicenseDataAPI } from '@/axios';
import { ErrorMessage } from '@/components/common';
import { PluginSearch } from '@/components/PluginSearch';
import { PluginSearchProvider } from '@/context/search';
import {
  SpdxLicenseData,
  SpdxLicenseProvider,
  SpdxLicenseResponse,
} from '@/context/spdx';
import { URLParameterStateProvider } from '@/context/urlParameters';
import { loadingState } from '@/store/loading';
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
  const [isLoading] = useAtom(loadingState);

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
          <URLParameterStateProvider>
            <SpdxLicenseProvider licenses={licenses}>
              {/*
                Don't render PluginSearchProvider while loading. For some
                reason, rendering while loading leads to a bug that freezes the
                entire UI.
              */}
              {isLoading ? (
                <PluginSearch />
              ) : (
                <PluginSearchProvider pluginIndex={index}>
                  <PluginSearch />
                </PluginSearchProvider>
              )}
            </SpdxLicenseProvider>
          </URLParameterStateProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
