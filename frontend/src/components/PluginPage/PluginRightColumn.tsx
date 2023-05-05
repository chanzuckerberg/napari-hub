import { useTranslation } from 'next-i18next';
import { snapshot } from 'valtio';

import { Markdown } from '@/components/Markdown';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TOCHeader } from '@/components/TableOfContents';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';
import { pluginTabsStore } from '@/store/pluginTabs';
import { PluginTabType } from '@/types/plugin';

import { ANCHOR } from './CitationInfo.constants';
import { SupportInfo } from './SupportInfo';

function PluginTOC() {
  const [t] = useTranslation(['pluginPage']);
  const { plugin } = usePluginState();
  const plausible = usePlausible();
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  const citationHeader: TOCHeader = {
    id: ANCHOR,
    text: t('pluginPage:citations.title'),
  };

  return (
    <SkeletonLoader
      className="h-56 mt-sds-xxl"
      render={() => (
        <Markdown.TOC
          className="mt-sds-xxl"
          markdown={plugin?.description ?? ''}
          onClick={(section, id) => {
            if (plugin?.name) {
              plausible('Description Nav', {
                section,
                plugin: plugin.name,
              });

              // Open description tab and scroll to heading if user clicked
              // on TOC while in another tab.
              const { activeTab } = snapshot(pluginTabsStore);
              if (activeTab !== PluginTabType.Description) {
                pluginTabsStore.activeTab = PluginTabType.Description;

                // Use `setTimeout` so that we execute scroll in next tick.
                // This is required so that we give the frontend enough time
                // to re-render based on changing the `activeTab` state.
                setTimeout(() => {
                  const heading = document.getElementById(id);
                  if (heading) {
                    window.scroll(0, heading?.offsetTop);
                  }
                });
              }
            }
          }}
          free
          extraHeaders={
            plugin?.citations && !isActivityDashboardEnabled
              ? [citationHeader]
              : undefined
          }
        />
      )}
    />
  );
}

export function PluginRightColumn() {
  return (
    <div className="col-start-4 screen-1425:col-start-5 hidden screen-1150:block">
      {/*  Keep CTA button and TOC on screen when scrolling on 2xl. */}
      <div className="sticky top-[50px]">
        <SkeletonLoader
          className="h-[228px] my-6"
          render={() => (
            <SupportInfo className="mt-sds-xl screen-495:mt-sds-xxl" />
          )}
        />
      </div>

      <div className="sticky top-[110px]">
        <PluginTOC />
      </div>
    </div>
  );
}
