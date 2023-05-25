import { ReactNode } from 'react';

import { Layout } from '@/components/Layout';
import { SitemapPage } from '@/components/SitemapPage';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { LoadingStateProvider } from '@/context/loading';
import SearchPage from '@/pages/index';
import PluginPage from '@/pages/plugins/[name]';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { PluginHomePageData, PluginType } from '@/types';
import { isHomePage, isPluginPage, isSitemapPage } from '@/utils';

import { HomePage, HomePageProvider } from './HomePage';

interface Props {
  nextUrl: string;
}

/**
 * Renders the appropriate loader component for a specific page.
 */
export function AppLoader({ nextUrl }: Props) {
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');

  let homePageLoader: ReactNode;
  if (isHomePage(nextUrl)) {
    const plugins = Array(3)
      .fill(null)
      .map(() => DEFAULT_PLUGIN_DATA as unknown as PluginHomePageData);

    homePageLoader = isHomePageRedesign ? (
      <LoadingStateProvider loading key="/">
        <HomePageProvider
          pluginSections={{
            plugin_type: {
              plugins,
              type: PluginType.SampleData,
            },
            newest: { plugins },
            recently_updated: { plugins },
            top_installs: { plugins },
          }}
        >
          <HomePage />
        </HomePageProvider>
      </LoadingStateProvider>
    ) : (
      <LoadingStateProvider loading key="/">
        <SearchPage index={[]} licenses={[]} />
      </LoadingStateProvider>
    );
  }

  const pluginPageLoader = isPluginPage(nextUrl) && (
    <Layout key="/plugins">
      <LoadingStateProvider loading>
        <PluginPage plugin={DEFAULT_PLUGIN_DATA} repo={DEFAULT_REPO_DATA} />
      </LoadingStateProvider>
    </Layout>
  );

  const sitemapPageLoader = isSitemapPage(nextUrl) && (
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
    </>
  );
}
