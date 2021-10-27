import { createContext, ReactNode, useContext } from 'react';

interface MetadataContextValue {
  empty: boolean;
  inline: boolean;
}

const MetadataContext = createContext<MetadataContextValue>({
  empty: false,
  inline: false,
});

interface Props extends MetadataContextValue {
  children: ReactNode;
}

export function MetadataContextProvider({ children, ...props }: Props) {
  return (
    <MetadataContext.Provider value={props}>
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadataContext(): MetadataContextValue {
  return useContext(MetadataContext);
}
