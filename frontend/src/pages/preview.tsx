import fs from 'fs-extra';
import { GetStaticPropsContext, GetStaticPropsResult } from 'next';
import DefaultErrorPage from 'next/error';
import Head from 'next/head';
import { SSRConfig, useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect } from 'react';
import { DeepPartial } from 'utility-types';

import { PluginPage } from '@/components/PluginPage';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { MetadataId, PluginStateProvider } from '@/context/plugin';
import { previewStore } from '@/store/preview';
import { PluginData } from '@/types';
import { I18nNamespace } from '@/types/i18n';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';

interface BaseProps {
  plugin: DeepPartial<PluginData>;
}

type Props = BaseProps & FetchRepoDataResult & SSRConfig;

const PLUGIN_PATH = process.env.PREVIEW;

export async function getStaticProps({
  locale,
}: GetStaticPropsContext): Promise<GetStaticPropsResult<Props>> {
  const translationProps = await serverSideTranslations(locale ?? 'en', [
    'common',
    'footer',
    'pageTitles',
    'pluginPage',
    'pluginData',
    'preview',
  ] as I18nNamespace[]);

  // Return default data to prevent Next.js error if the plugin path is not defined.
  if (!PLUGIN_PATH) {
    return {
      props: {
        ...translationProps,
        plugin: DEFAULT_PLUGIN_DATA,
        repo: DEFAULT_REPO_DATA,
      },
    };
  }

  const pluginData = await fs.readFile(PLUGIN_PATH, 'utf-8');
  const plugin = JSON.parse(pluginData) as DeepPartial<PluginData>;
  const repoFetchResult =
    plugin.code_repository && (await fetchRepoData(plugin.code_repository));

  return {
    props: {
      ...translationProps,
      plugin,
      ...(repoFetchResult || { repo: DEFAULT_REPO_DATA }),
    },
  };
}

export default function PreviewPage({ plugin, repo, repoFetchError }: Props) {
  const [t] = useTranslation(['pageTitles', 'pluginData']);

  // Set active metadata ID on initial load if the hash is already set.
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (id && id.startsWith('metadata-')) {
      previewStore.activeMetadataField = id as MetadataId;
    }
  }, []);

  // Return 404 page in production or if the plugin path is not defined.
  if (PROD || !PLUGIN_PATH) {
    return <DefaultErrorPage statusCode={404} />;
  }

  return (
    <>
      <Head>
        <title>
          napari hub | {t('pageTitles:preview')} |{' '}
          {plugin.name || t('pluginData:labels.pluginName.label')}
        </title>
      </Head>

      <PluginStateProvider
        plugin={plugin}
        repo={repo}
        repoFetchError={repoFetchError}
      >
        <PluginPage />
      </PluginStateProvider>
    </>
  );
}
