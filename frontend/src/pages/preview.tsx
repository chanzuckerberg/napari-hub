import fs from 'fs-extra';
import { GetStaticPropsResult } from 'next';

import { PluginDetails } from '@/components';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData } from '@/types';
import { fetchRepoData, FetchRepoDataResult } from '@/utils';

interface Props extends FetchRepoDataResult {
  plugin: PluginData;
}

export async function getStaticProps(): Promise<GetStaticPropsResult<Props>> {
  const pluginPath = process.env.PREVIEW;

  if (!pluginPath) {
    return {
      props: {
        plugin: DEFAULT_PLUGIN_DATA,
        repo: DEFAULT_REPO_DATA,
      },
    };
  }

  const pluginData = await fs.readFile(pluginPath, 'utf-8');
  const plugin = JSON.parse(pluginData) as PluginData;
  const repoFetchResult = await fetchRepoData(plugin.code_repository);

  return {
    props: {
      plugin,
      ...repoFetchResult,
    },
  };
}

export default function PreviewPage({ plugin, repo, repoFetchError }: Props) {
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
