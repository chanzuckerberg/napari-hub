import clsx from 'clsx';
import { isObject } from 'lodash';
import dynamic from 'next/dynamic';
import { ReactNode, RefObject, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnapshot } from 'valtio';

import { CategoryChipContainer } from '@/components/CategoryChip';
import { Markdown } from '@/components/Markdown';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TabData, Tabs } from '@/components/Tabs';
import { useLoadingState } from '@/context/loading';
import { usePluginState } from '@/context/plugin';
import { useMediaQuery, usePlausible } from '@/hooks';
import { pluginTabsStore, resetPluginTabs } from '@/store/pluginTabs';
import { HubDimension } from '@/types';
import { PluginTabType } from '@/types/plugin';

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

interface Props {
  containerRef: RefObject<HTMLElement>;
}

export function PluginTabs({ containerRef }: Props) {
  const { plugin } = usePluginState();
  const { activeTab } = useSnapshot(pluginTabsStore);
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });
  const plausible = usePlausible();
  const isLoading = useLoadingState();

  // Reset plugin tab state when navigating away from page.
  useEffect(resetPluginTabs, []);

  const tabs = usePluginTabs();
  let tabContent: ReactNode = null;

  if (activeTab === PluginTabType.Description) {
    tabContent = (
      <>
        {/* Plugin categories */}
        <div
          className={clsx(
            'flex flex-col text-xs mt-sds-xl',
            'mb-sds-l screen-495:mb-sds-xl',
            'gap-sds-m screen-495:gap-sds-l',
          )}
        >
          <SkeletonLoader>
            {plugin?.category_hierarchy &&
              isObject(plugin.category_hierarchy) &&
              Object.entries(plugin.category_hierarchy)
                .filter(
                  ([pluginDimension]) =>
                    !pluginDimension.includes('Supported data'),
                )
                .map(([pluginDimension, pluginHierarchies]) => (
                  <CategoryChipContainer
                    key={pluginDimension}
                    dimension={pluginDimension as HubDimension}
                    hierarchies={pluginHierarchies as string[][]}
                    containerRef={containerRef}
                    pluginName={plugin.name ?? ''}
                  />
                ))}
          </SkeletonLoader>
        </div>

        <SkeletonLoader className="h-[600px] mb-sds-xxl">
          <div className="flex items-center justify-between mb-sds-xxl">
            <Markdown disableHeader>{plugin?.description || ''}</Markdown>
          </div>
        </SkeletonLoader>

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
    <div className="mt-sds-xl screen-495:mt-sds-xxl">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          pluginTabsStore.activeTab = tab.value;

          plausible('Plugin Tab Nav', {
            tab: tab.value,
            plugin: plugin?.name ?? '',
          });
        }}
        underline
        loading={isLoading}
      />

      {tabContent}
    </div>
  );
}
