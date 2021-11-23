/**
 * Context for sharing data that is used to populate the plugin search filters.
 * This is required by the `ComplexFilter` component so that the data is
 * immediately available on initial render to prevent a race condition issue.
 */

import { createContext, ReactNode, useContext } from 'react';

import { HubDimension, PluginIndexData } from '@/types';

export interface FilterData {
  categoryFilterKeys: Partial<Record<HubDimension, Set<string>>>;
}

const FilterDataContext = createContext<FilterData>({
  categoryFilterKeys: {},
});

interface Props {
  index: PluginIndexData[];
  children: ReactNode;
}

export function FilterDataProvider({ children, index }: Props) {
  const categoryFilterKeys: FilterData['categoryFilterKeys'] = {};

  // For each plugin and category, add the keys used to a set mapped by category.
  for (const plugin of index) {
    if (plugin?.category) {
      for (const [dimension, keys] of Object.entries(plugin.category)) {
        const hubDimension = dimension as HubDimension;
        let keySet = categoryFilterKeys[hubDimension];

        if (!keySet) {
          keySet = new Set();
          categoryFilterKeys[hubDimension] = keySet;
        }

        keys.forEach((key) => keySet?.add(key));
      }
    }
  }

  return (
    <FilterDataContext.Provider value={{ categoryFilterKeys }}>
      {children}
    </FilterDataContext.Provider>
  );
}

export function useFilterData() {
  return useContext(FilterDataContext);
}
