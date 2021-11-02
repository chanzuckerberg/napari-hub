import fs from 'fs-extra';
import { GetStaticPropsResult } from 'next';
import DefaultErrorPage from 'next/error';
import { DeepPartial } from 'utility-types';

import { PluginDetails } from '@/components/PluginDetails';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { PluginStateProvider } from '@/context/plugin';
import { PROD } from '@/env';
import { PluginData } from '@/types';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';

interface Props extends FetchRepoDataResult {
  plugin: DeepPartial<PluginData>;
}

const PLUGIN_PATH = process.env.PREVIEW;

export async function getStaticProps(): Promise<GetStaticPropsResult<Props>> {
  // Return default data to prevent Next.js error if the plugin path is not defined.
  if (!PLUGIN_PATH) {
    return {
      props: {
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
      plugin,
      ...(repoFetchResult || { repo: DEFAULT_REPO_DATA }),
    },
  };
}

export default function PreviewPage({ plugin, repo, repoFetchError }: Props) {
  // Return 404 page in production or if the plugin path is not defined.
  if (PROD || !PLUGIN_PATH) {
    return <DefaultErrorPage statusCode={404} />;
  }

  return (
    <PluginStateProvider
      plugin={plugin}
      repo={repo}
      repoFetchError={repoFetchError}
    >
      <PluginDetails />
    </PluginStateProvider>
  );
}
