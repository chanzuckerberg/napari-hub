import axios, { AxiosError } from 'axios';
import { ReactNode } from 'react';

import { ErrorMessage } from '@/components/common';
import { PluginSearch } from '@/components/PluginSearch';
import { PluginSearchProvider } from '@/context/search';
import { URLParameterStateProvider } from '@/context/urlParameters';
import { PluginIndexData } from '@/types';

interface Props {
  index?: PluginIndexData[];
  error?: string;
}

export async function getServerSideProps() {
  const url = '/plugins/index';
  const props: Props = {};

  try {
    const { data } = await axios.get<PluginIndexData[]>(url);
    props.index = data;
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

export default function Home({ error, index }: Props) {
  return (
    <>
      {error ? (
        <ErrorMessage error={error}>Unable to fetch plugin index</ErrorMessage>
      ) : (
        index && (
          <URLParameterStateProvider>
            <PluginSearchProvider pluginIndex={index}>
              <PluginSearch />
            </PluginSearchProvider>
          </URLParameterStateProvider>
        )
      )}
    </>
  );
}

// Return page by itself so we can wrap the layout with <PluginSearchProvider>
Home.getLayout = (page: ReactNode) => page;
