import axios, { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import { ParsedUrlQuery } from 'node:querystring';

import { PluginDetails } from '@/components';
import { ErrorMessage } from '@/components/common';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';

const API_URL = process.env.API_URL || 'http://localhost:8081';

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

interface Props {
  plugin?: PluginData;
  error?: string;
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

/**
 * Fetches plugin data from the hub API. The name of the plugin is extracted
 * from the URL `/plugins/:name` and used for fetching the plugin data.
 */
export async function getServerSideProps({
  params,
}: GetServerSidePropsContext<Params>) {
  const name = String(params?.name);
  const url = `${API_URL}/plugins/${name}`;
  const props: Partial<Props> = {};

  try {
    const { data } = await axios.get<PluginData | RequestError>(url);

    if (isRequestError(data)) {
      props.error = JSON.stringify(data, null, 2);
    } else if (isPlugin(data)) {
      props.plugin = data;
    }
  } catch (err) {
    const error = err as AxiosError;
    props.error = error.message;
  }

  return { props };
}

/**
 * This page fetches plugin data from the hub API and renders it in the
 * PluginDetails component.
 */
export default function PluginPage({ error, plugin }: Props) {
  return (
    <>
      {error ? (
        <ErrorMessage error={error}>Unable to load plugin</ErrorMessage>
      ) : (
        <>
          {plugin ? (
            <PluginStateProvider plugin={plugin}>
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
