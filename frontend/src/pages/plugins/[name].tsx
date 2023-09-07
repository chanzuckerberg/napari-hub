import { AxiosError } from 'axios';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { ParsedUrlQuery } from 'node:querystring';

import { ErrorMessage } from '@/components/ErrorMessage';
import { PageMetadata } from '@/components/PageMetadata';
import { PluginPage } from '@/components/PluginPage';
import { DEFAULT_REPO_DATA } from '@/constants/plugin';
import { useLoadingState } from '@/context/loading';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';
import { createUrl, fetchRepoData, FetchRepoDataResult, Logger } from '@/utils';
import { getErrorMessage } from '@/utils/error';
import { hubAPI } from '@/utils/HubAPIClient';
import { getServerSidePropsHandler } from '@/utils/ssr';

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

type Props = FetchRepoDataResult & BaseProps;

function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as AxiosError).isAxiosError;
}

const logger = new Logger('pages/plugins/[name].tsx');

export const getServerSideProps = getServerSidePropsHandler<Props, Params>({
  /**
   * Fetches plugin data from the hub API. The name of the plugin is extracted
   * from the URL `/plugins/:name` and used for fetching the plugin data.
   */
  async getProps({ params }) {
    const name = String(params?.name);
    const props: Props = {
      repo: DEFAULT_REPO_DATA,
    };

    let codeRepo = '';

    try {
      const plugin = await hubAPI.getPlugin(name);
      codeRepo = plugin.code_repository;
      props.plugin = plugin;
    } catch (err) {
      props.error = getErrorMessage(err);
      logger.error({
        message: 'Failed to fetch plugin data',
        plugin: name,
        error: props.error,
      });

      return { props };
    }

    const repoData = await fetchRepoData(codeRepo);
    Object.assign(repoData, await fetchRepoData(codeRepo));

    if (props.repoFetchError) {
      logger.error({
        message: 'Failed to fetch repo data',
        plugin: name,
        error: props.error,
      });
    }

    return { props };
  },
});

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
    title = `${plugin.display_name ?? plugin.name} - ${title}`;

    const authors = plugin.authors.map(({ name }) => name).join(', ');
    if (authors) {
      title = `${title} - ${authors}`;
    }

    for (const { name } of plugin.authors ?? []) {
      if (name) {
        keywords.push(plugin.name, name);
      }
    }
  }

  return (
    <>
      <PageMetadata
        description={plugin?.summary}
        keywords={keywords}
        title={title}
        twitterUser={plugin?.twitter}
        url={
          plugin?.name
            ? createUrl(`/plugins/${plugin.name}`, process.env.FRONTEND_URL)
                .href
            : undefined
        }
      />

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
