import { createContext, ReactNode, useContext } from 'react';
import { DeepPartial } from 'utility-types';

import { PluginData, PluginRepoData, PluginRepoFetchError } from '@/types';

/**
 * Shared state for plugin data.
 */
interface PluginState {
  plugin?: DeepPartial<PluginData>;
  repo: PluginRepoData;
  repoFetchError?: PluginRepoFetchError;
}

const PluginStateContext = createContext<PluginState | null>(null);

interface Props extends PluginState {
  children: ReactNode;
}

/**
 * Provider for plugin state.  This allows child components to access the
 * plugin state directly from context so that we don't have to pass the
 * `plugin` prop around everywhere.
 */
export function PluginStateProvider({ children, ...props }: Props) {
  return (
    <PluginStateContext.Provider value={props}>
      {children}
    </PluginStateContext.Provider>
  );
}

/**
 * Hook for accessing the plugin state context.  This allows components to
 * access the plugin data from anywhere.
 *
 * @returns The plugin state
 */
export function usePluginState(): PluginState {
  const context = useContext(PluginStateContext);

  if (!context) {
    throw new Error('usePluginState must be used in a PluginStateProvider');
  }

  return context;
}
