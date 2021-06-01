import { AxiosError } from 'axios';
import { ReactNode } from 'react';

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
  return (
    <>
      {error ? (
        <ErrorMessage error={error}>Unable to fetch plugin index</ErrorMessage>
      ) : (
        index &&
        licenses && (
          <URLParameterStateProvider>
            <SpdxLicenseProvider licenses={licenses}>
              <PluginSearchProvider pluginIndex={index}>
                <PluginSearch />
              </PluginSearchProvider>
            </SpdxLicenseProvider>
          </URLParameterStateProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
