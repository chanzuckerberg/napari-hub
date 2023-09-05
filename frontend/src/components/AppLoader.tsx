import { ReactNode } from 'react';

import { Layout } from '@/components/Layout';
import { SitemapPage } from '@/components/SitemapPage';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { LoadingStateProvider } from '@/context/loading';
import { usePageUtils } from '@/hooks/usePageUtils';
import SearchPage from '@/pages/plugins';
import PluginPage from '@/pages/plugins/[name]';
import { PluginHomePageData, PluginType } from '@/types';

import { HomePage, HomePageProvider } from './HomePage';

interface Props {
  nextUrl: string;
}

/**
 * Renders the appropriate loader component for a specific page.
 */
export function AppLoader({ nextUrl }: Props) {
  const pageUtils = usePageUtils();

  let homePageLoader: ReactNode;
  if (pageUtils.isHomePage(nextUrl)) {
    const plugins = Array(3)
      .fill(null)
      .map(() => DEFAULT_PLUGIN_DATA as unknown as PluginHomePageData);

    homePageLoader = (
      <LoadingStateProvider loading key="/">
        <HomePageProvider
          pluginSections={{
            plugin_types: {
              plugins,
              type: PluginType.SampleData,
            },
            newest: { plugins },
            recently_updated: { plugins },
            top_installed: { plugins },
          }}
        >
          <HomePage />
        </HomePageProvider>
      </LoadingStateProvider>
    );
  }

  const searchPageLoader = pageUtils.isSearchPage(nextUrl) && (
    <LoadingStateProvider loading key="/">
      <Layout key="/plugins">
        <SearchPage />
      </Layout>
    </LoadingStateProvider>
  );

  const pluginPageLoader = pageUtils.isPluginPage(nextUrl) && (
    <Layout key="/plugins">
      <LoadingStateProvider loading>
        <PluginPage plugin={DEFAULT_PLUGIN_DATA} repo={DEFAULT_REPO_DATA} />
      </LoadingStateProvider>
    </Layout>
  );

  const sitemapPageLoader = pageUtils.isSitemapPage(nextUrl) && (
    <Layout key="/sitemap">
      <LoadingStateProvider loading>
        <SitemapPage entries={[]} />
      </LoadingStateProvider>
    </Layout>
  );

  return (
    <>
      {homePageLoader}
      {pluginPageLoader}
      {sitemapPageLoader}
      {searchPageLoader}
    </>
  );
}
