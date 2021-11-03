import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'node:querystring';

import { hubAPI } from '@/axios';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { PageMetadata } from '@/components/common/PageMetadata';
import { PluginDetails } from '@/components/PluginDetails';
import { useLoadingState } from '@/context/loading';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';

/**
 * Interface for parameters in URL.
 */
interface Params extends ParsedUrlQuery {
  name: string;
}

/**
 * Error returned by API server if a server error occurs.
 */
interface RequestError {
  errorMessage: string;
  errorType: string;
  stackTrace: string[];
}

interface Props extends FetchRepoDataResult {
  error?: string;
  plugin?: PluginData;
}

type RequestResponse = PluginData | RequestError;

/**
 * Helper that checks if the request is an error on the server.
 */
function isRequestError(data: RequestResponse): data is RequestError {
  return !!(data as RequestError).errorType;
}

/**
 * Helper that checks if the plugin data is valid.
 */
function isPlugin(data: RequestResponse): data is RequestError {
  return !!(data as PluginData).name;
}

function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as AxiosError).isAxiosError;
}

/**
 * Fetches plugin data from the hub API. The name of the plugin is extracted
 * from the URL `/plugins/:name` and used for fetching the plugin data.
 */
export async function getServerSideProps({
  params,
}: GetServerSidePropsContext<Params>) {
  const name = String(params?.name);
  const url = `/plugins/${name}`;
  const props: Partial<Props> = {};

  try {
    const { data } = await hubAPI.get<PluginData | RequestError>(url);

    if (isRequestError(data)) {
      props.error = JSON.stringify(data, null, 2);
    } else if (isPlugin(data)) {
      props.plugin = data;

      const result = await fetchRepoData(data.code_repository);
      Object.assign(props, result);
    }
  } catch (err) {
    if (isAxiosError(err)) {
      props.error = err.message;
    }
  }

  return { props };
}

/**
 * This page fetches plugin data from the hub API and renders it in the
 * PluginDetails component.
 */
export default function PluginPage({
  error,
  plugin,
  repo,
  repoFetchError,
}: Props) {
  const router = useRouter();
  const isLoading = useLoadingState();

  const keywords: string[] = [];
  let title = 'napari hub | plugins';
  if (isLoading) {
    title = `${title} | loading...`;
  } else if (plugin?.name && plugin?.authors) {
    title = `${title} | ${plugin.name}`;

    const authors = plugin.authors.map(({ name }) => name).join(', ');
    if (authors) {
      title = `${title} by ${authors}`;
    }

    for (const { name } of plugin.authors ?? []) {
      if (name) {
        keywords.push(plugin.name, name);
      }
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <PageMetadata
          keywords={keywords}
          description={plugin?.summary}
          pathname={router.pathname}
        />
      </Head>

      {error ? (
        <ErrorMessage error={error}>Unable to load plugin</ErrorMessage>
      ) : (
        <>
          {plugin ? (
            <PluginStateProvider
              plugin={plugin}
              repo={repo}
              repoFetchError={repoFetchError}
            >
              <PluginDetails />
            </PluginStateProvider>
          ) : (
            <ErrorMessage>Empty plugin data</ErrorMessage>
          )}
        </>
      )}
    </>
  );
}
