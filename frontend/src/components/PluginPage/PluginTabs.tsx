import Skeleton from '@mui/material/Skeleton';
import dynamic from 'next/dynamic';
import { ReactNode, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { Markdown } from '@/components/Markdown';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TabData, Tabs } from '@/components/Tabs';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import { useMediaQuery, usePlausible } from '@/hooks';
import { pluginTabsStore, resetPluginTabs } from '@/store/pluginTabs';
import { PluginTabType } from '@/types/plugin';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { PluginMetadata } from './PluginMetadata';

const ActivityDashboard = dynamic<Record<string, unknown>>(
  () =>
    import('@/components/ActivityDashboard').then(
      (mod) => mod.ActivityDashboard,
    ),
  { ssr: false },
);

function usePluginTabs() {
  const { plugin } = usePluginState();
  const [t] = useTranslation(['pluginPage']);

  return useMemo(() => {
    const tabs: TabData<PluginTabType>[] = [
      {
        label: t('pluginPage:tabs.description'),
        value: PluginTabType.Description,
      },

      {
        label: t('pluginPage:tabs.activity'),
        new: true,
        value: PluginTabType.Activity,
      },
    ];

    if (plugin?.citations) {
      tabs.push({
        label: t('pluginPage:tabs.citation'),
        value: PluginTabType.Citation,
      });
    }

    return tabs;
  }, [plugin?.citations, t]);
}

export function PluginTabs() {
  const { plugin, isEmptyDescription } = usePluginState();
  const [t] = useTranslation(['pluginPage', 'preview']);
  const { activeTab } = useSnapshot(pluginTabsStore);
  const isLoading = useLoadingState();
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });
  const plausible = usePlausible();

  // Reset plugin tab state when navigating away from page.
  useEffect(resetPluginTabs, []);

  const tabs = usePluginTabs();
  let tabContent: ReactNode = null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(3,92px)] h-8 space-x-sds-m">
        <Skeleton variant="rectangular" />
        <Skeleton variant="rectangular" />
        <Skeleton variant="rectangular" />
      </div>
    );
  }

  if (activeTab === PluginTabType.Description) {
    tabContent = (
      <>
        <SkeletonLoader
          className="h-[600px] mb-sds-xxl"
          render={() => (
            <MetadataHighlighter
              metadataId="metadata-description"
              className="flex items-center justify-between mb-sds-xxl"
              highlight={isEmptyDescription}
            >
              <Markdown disableHeader placeholder={isEmptyDescription}>
                {plugin?.description || t('preview:emptyDescription')}
              </Markdown>
            </MetadataHighlighter>
          )}
        />

        <CallToActionButton className="mb-6 screen-495:mb-12 screen-1150:mb-20" />

        <PluginMetadata
          enableScrollID={hasPluginMetadataScroll}
          className="screen-1425:hidden"
          inline
        />
      </>
    );
  }

  if (activeTab === PluginTabType.Activity && plugin?.name) {
    tabContent = <ActivityDashboard />;
  }

  if (activeTab === PluginTabType.Citation && plugin?.citations) {
    tabContent = <CitationInfo className="mt-sds-xxl" />;
  }

  return (
    <>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          pluginTabsStore.activeTab = tab.value;
        }}
        underline
      />

      {tabContent}
    </>
  );
}
