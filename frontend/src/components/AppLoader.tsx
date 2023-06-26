import { ReactNode } from 'react';

import { Layout } from '@/components/Layout';
import { SitemapPage } from '@/components/SitemapPage';
import { DEFAULT_PLUGIN_DATA, DEFAULT_REPO_DATA } from '@/constants/plugin';
import { LoadingStateProvider } from '@/context/loading';
import { usePageUtils } from '@/hooks/usePageUtils';
import SearchPageV1 from '@/pages/index';
import SearchPageV2 from '@/pages/plugins';
import PluginPage from '@/pages/plugins/[name]';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { PluginHomePageData, PluginType } from '@/types';

import { HomePage, HomePageProvider } from './HomePage';

interface Props {
  nextUrl: string;
}

/**
 * Renders the appropriate loader component for a specific page.
 */
export function AppLoader({ nextUrl }: Props) {
  const isHomePageRedesign = useIsFeatureFlagEnabled('homePageRedesign');
  const pageUtils = usePageUtils();

  let homePageLoader: ReactNode;
  if (isHomePageRedesign && pageUtils.isHomePage(nextUrl)) {
    const plugins = Array(3)
      .fill(null)
      .map(() => DEFAULT_PLUGIN_DATA as unknown as PluginHomePageData);

    homePageLoader = (
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
    );
  }

  const searchPageLoader = pageUtils.isSearchPage(nextUrl) && (
    <LoadingStateProvider loading key="/">
      {isHomePageRedesign ? (
        <Layout key="/plugins">
          <SearchPageV2 />
        </Layout>
      ) : (
        <SearchPageV1 index={[]} licenses={[]} />
      )}
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
