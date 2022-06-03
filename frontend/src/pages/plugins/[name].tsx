import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'node:querystring';

import { ErrorMessage } from '@/components/ErrorMessage';
import { PageMetadata } from '@/components/PageMetadata';
import { PluginPage } from '@/components/PluginPage';
import { useLoadingState } from '@/context/loading';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';
import { I18nNamespace } from '@/types/i18n';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';
import { hubAPI } from '@/utils/axios';

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

interface BaseProps {
  error?: string;
  plugin?: PluginData;
}

type Props = FetchRepoDataResult & Partial<SSRConfig> & BaseProps;

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
  locale,
}: GetServerSidePropsContext<Params>) {
  const name = String(params?.name);
  const url = `/plugins/${name}`;
  const translationProps = await serverSideTranslations(locale ?? 'en', [
    'common',
    'footer',
    'pageTitles',
    'pluginData',
    'pluginPage',

    // Home page namespace required for page transitions to search page from the
    // plugin page.
    'homePage',
  ] as I18nNamespace[]);
  const props: Partial<Props> = { ...translationProps };

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
export default function Plugin({ error, plugin, repo, repoFetchError }: Props) {
  const isLoading = useLoadingState();
  const [t] = useTranslation(['pageTitles', 'pluginPage']);

  const keywords: string[] = [];
  let title = t('pageTitles:plugin');
  if (isLoading) {
    title = `${title} | ${t('pageTitles:loading')}...`;
  } else if (plugin?.name && plugin?.authors) {
    title = `${title} | ${plugin.name}`;

    const authors = plugin.authors.map(({ name }) => name).join(', ');
    if (authors) {
      title = `${title} ${t('pageTitles:by')} ${authors}`;
    }

    for (const { name } of plugin.authors ?? []) {
      if (name) {
        keywords.push(plugin.name, name);
      }
    }
  }

  return (
    <>
      <PageMetadata keywords={keywords} description={plugin?.summary} />

      <Head>
        <title>{title}</title>
      </Head>

      {error ? (
        <ErrorMessage error={error}>
          {t('pluginPage:errors.fetch')}
        </ErrorMessage>
      ) : (
        <>
          {plugin ? (
            <PluginStateProvider
              plugin={plugin}
              repo={repo}
              repoFetchError={repoFetchError}
            >
              <PluginPage />
            </PluginStateProvider>
          ) : (
            <ErrorMessage>{t('pluginPage:errors.emptyPlugin')}</ErrorMessage>
          )}
        </>
      )}
    </>
  );
}
