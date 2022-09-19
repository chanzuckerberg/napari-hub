import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'node:querystring';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ErrorMessage';
import { PageMetadata } from '@/components/PageMetadata';
import { PluginPage } from '@/components/PluginPage';
import { useLoadingState } from '@/context/loading';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';
import { I18nNamespace } from '@/types/i18n';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';
import { hubAPI } from '@/utils/HubAPIClient';
import { getZodErrorMessage } from '@/utils/validate';

/**
 * Interface for parameters in URL.
 */
interface Params extends ParsedUrlQuery {
  name: string;
}

interface BaseProps {
  error?: string;
  plugin?: PluginData;
}

type Props = FetchRepoDataResult & Partial<SSRConfig> & BaseProps;

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
  const translationProps = await serverSideTranslations(locale ?? 'en', [
    'common',
    'footer',
    'pageTitles',
    'pluginData',
    'pluginPage',
    'activity',

    // Home page namespace required for page transitions to search page from the
    // plugin page.
    'homePage',
  ] as I18nNamespace[]);
  const props: Partial<Props> = { ...translationProps };

  try {
    const data = await hubAPI.getPlugin(name);
    props.plugin = data;

    const result = await fetchRepoData(data.code_repository);
    Object.assign(props, result);
  } catch (err) {
    if (isAxiosError(err) || err instanceof Error) {
      props.error = err.message;
    }

    if (err instanceof z.ZodError) {
      props.error = getZodErrorMessage(err);
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
