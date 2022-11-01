import { proxy } from 'valtio';

import { PluginTabType } from '@/types/plugin';

const DEFAULT_TAB = PluginTabType.Description;

/**
 * Store used holding state related to the plugin tabs
 */
export const pluginTabsStore = proxy({
  activeTab: DEFAULT_TAB,
});

export function resetPluginTabs(): void {
  pluginTabsStore.activeTab = DEFAULT_TAB;
}
