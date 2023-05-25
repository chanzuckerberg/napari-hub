import { createContext, ReactNode, useContext, useMemo } from 'react';

import { PluginSectionsResponse } from '@/types';

interface HomePageContextValue {
  pluginSections: PluginSectionsResponse;
}

const HomePageContext = createContext<HomePageContextValue | null>(null);

interface Props extends Pick<HomePageContextValue, 'pluginSections'> {
  children: ReactNode;
}

export function HomePageProvider({ children, pluginSections }: Props) {
  const value = useMemo(
    () => ({
      pluginSections,
    }),
    [pluginSections],
  );

  return (
    <HomePageContext.Provider value={value}>
      {children}
    </HomePageContext.Provider>
  );
}

export function useHomePage(): HomePageContextValue {
  const value = useContext(HomePageContext);

  if (!value) {
    throw new Error('useHomePage must be used in a HomePageProvider');
  }

  return value;
}
