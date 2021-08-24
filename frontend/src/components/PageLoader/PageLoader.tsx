import { Provider } from 'jotai';
import { ReactNode } from 'react';

import { Layout } from '@/components/Layout';
import { PluginDetails } from '@/components/PluginDetails';
import { PluginSearch } from '@/components/PluginSearch';
import { loadingState } from '@/store/loading';
import {
  DEFAULT_PLUGIN_STATE,
  DEFAULT_REPO_STATE,
  pluginState,
  repoState,
} from '@/store/plugin';
import { isPluginPage, isSearchPage } from '@/utils';

function SearchPageLoader() {
  return (
    <Provider initialValues={[[loadingState, true]]}>
      <PluginSearch />
    </Provider>
  );
}

function PluginPageLoader() {
  return (
    <Layout>
      <Provider
        initialValues={[
          [loadingState, true],
          [pluginState, DEFAULT_PLUGIN_STATE],
          [repoState, DEFAULT_REPO_STATE],
        ]}
      >
        <PluginDetails />
      </Provider>
    </Layout>
  );
}

interface Props {
  loading: boolean;
  page: ReactNode;
  url: string;
}

/**
 * Component that renders a page loader in place of the page for a given URL.
 * If the page loader is not currently loading or if there is no page loader
 * defined, then the page is rendered instead.
 */
export function PageLoader({ loading, page, url }: Props) {
  if (!loading) {
    return <>{page}</>;
  }

  let loader: ReactNode = null;

  if (isSearchPage(url)) {
    loader = <SearchPageLoader />;
  }

  if (isPluginPage(url)) {
    loader = <PluginPageLoader />;
  }

  return <>{loader ?? page}</>;
}
