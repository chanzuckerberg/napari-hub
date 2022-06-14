import { createContext, ReactNode, useContext } from 'react';

import { CollectionData } from '@/types/collections';

const CollectionContext = createContext<CollectionData | null>(null);

interface Props {
  collection: CollectionData;
  children: ReactNode;
}

/**
 * Provider for access to collection state from anywhere in collection page.
 */
export function CollectionContextProvider({ collection, children }: Props) {
  return (
    <CollectionContext.Provider value={collection}>
      {children}
    </CollectionContext.Provider>
  );
}

/**
 * Hook for accessing collection data from hub API.
 */
export function useCollection(): CollectionData {
  const collection = useContext(CollectionContext);

  if (!collection) {
    throw new Error(
      'useCollections() may not be used outside of CollectionContextProvider',
    );
  }

  return collection;
}
