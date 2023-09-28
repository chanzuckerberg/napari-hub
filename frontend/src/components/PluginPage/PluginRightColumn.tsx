import { snapshot } from 'valtio';

import { Markdown } from '@/components/Markdown';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';
import { pluginTabsStore } from '@/store/pluginTabs';
import { PluginTabType } from '@/types/plugin';

import { SupportInfo } from './SupportInfo';

function PluginTOC() {
  const { plugin } = usePluginState();
  const plausible = usePlausible();

  return (
    <SkeletonLoader
      className="h-[500px] mt-sds-xxl"
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
          className="h-[50px]"
          render={() => (
            <SupportInfo className="mt-sds-xl screen-495:mt-sds-xxl" />
          )}
        />

        <PluginTOC />
      </div>
    </div>
  );
}
