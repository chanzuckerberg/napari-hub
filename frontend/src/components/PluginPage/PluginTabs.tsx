import { Skeleton } from '@mui/material';
import { Tab, Tabs } from 'czifui';
import dynamic from 'next/dynamic';
import { ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { Props as ActivityDashboardProps } from '@/components/ActivityDashboard';
import { Markdown } from '@/components/Markdown';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import {
  useMediaQuery,
  usePluginActivity,
  usePluginInstallStats,
} from '@/hooks';
import { pluginTabsStore, resetPluginTabs } from '@/store/pluginTabs';
import { PluginTabType } from '@/types/plugin';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { PluginMetadata } from './PluginMetadata';

const ActivityDashboard = dynamic<ActivityDashboardProps>(
  () =>
    import('@/components/ActivityDashboard').then(
      (mod) => mod.ActivityDashboard,
    ),
  { ssr: false },
);

interface PluginTabData {
  label: string;
  tab: PluginTabType;
}

function usePluginTabs() {
  const { plugin } = usePluginState();
  const [t] = useTranslation(['pluginPage']);

  return [
    {
      label: t('pluginPage:tabs.description'),
      tab: PluginTabType.Description,
    },

    {
      label: t('pluginPage:tabs.activity'),
      tab: PluginTabType.Activity,
    },

    plugin?.citations
      ? {
          label: t('pluginPage:tabs.citation'),
          tab: PluginTabType.Citation,
        }
      : undefined,
  ].filter((tab): tab is PluginTabData => !!tab);
}

export function PluginTabs() {
  const { plugin, isEmptyDescription } = usePluginState();
  const [t] = useTranslation(['pluginPage', 'preview']);
  const { activeTab } = useSnapshot(pluginTabsStore);
  const isLoading = useLoadingState();
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });

  // Only load data activity data when on activity tab
  const { dataPoints } = usePluginActivity(plugin?.name, {
    enabled: activeTab === PluginTabType.Activity,
  });
  const { pluginStats } = usePluginInstallStats(plugin?.name, {
    enabled: activeTab === PluginTabType.Activity,
  });

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
    tabContent = (
      <ActivityDashboard
        data={dataPoints}
        installCount={pluginStats?.totalInstalls ?? 0}
        installMonthCount={pluginStats?.totalMonths ?? 0}
      />
    );
  }

  if (activeTab === PluginTabType.Citation && plugin?.citations) {
    tabContent = <CitationInfo className="mt-sds-xxl" />;
  }

  return (
    <>
      {/* Scroll container for tabs */}
      <div className="overflow-x-auto">
        {/* Bottom border for tabs */}
        <div className="mb-sds-m border-b border-black pb-px">
          <Tabs
            classes={{
              indicator: 'bg-black',
              root: 'm-0',
            }}
            value={activeTab}
            onChange={(_, nextTab) => {
              pluginTabsStore.activeTab = nextTab as PluginTabType;
            }}
          >
            {tabs.map(({ label, tab }) => (
              <Tab
                key={tab}
                label={
                  <p className="space-x-sds-m">
                    <span>{label}</span>

                    {tab === PluginTabType.Activity && (
                      <span className="bg-hub-primary-400 p-1 text-sds-body-xxxs">
                        {t('pluginPage:tabs.new')}
                      </span>
                    )}
                  </p>
                }
                value={tab}
                classes={{
                  root: 'text-black font-semibold px-sds-m mx-0 mb-sds-s',
                  selected: 'bg-bold',
                }}
              />
            ))}
          </Tabs>
        </div>
      </div>

      {tabContent}
    </>
  );
}
