import { createContext, ReactNode, useContext } from 'react';

import { CollectionIndexData } from '@/types/collections';

const CollectionsContext = createContext<CollectionIndexData[]>([]);

interface Props {
  collections: CollectionIndexData[];
  children: ReactNode;
}

/**
 * Provider for access to collections state from anywhere in collections home
 * page UI.
 */
export function CollectionsContextProvider({ collections, children }: Props) {
  return (
    <CollectionsContext.Provider value={collections}>
      {children}
    </CollectionsContext.Provider>
  );
}

/**
 * Hook for accessing list of collections from hub API.
 */
export function useCollections(): CollectionIndexData[] {
  return useContext(CollectionsContext);
}
