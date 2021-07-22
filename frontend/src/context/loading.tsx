import { createContext, ReactNode, useContext } from 'react';

const LoadingStateContext = createContext<boolean>(false);

interface Props {
  loading: boolean;
  children: ReactNode;
}

/**
 * Provider for providing global loading state to a component tree.
 */
export function LoadingStateProvider({ children, loading }: Props) {
  return (
    <LoadingStateContext.Provider value={loading}>
      {children}
    </LoadingStateContext.Provider>
  );
}

/**
 * Returns the global loading state.
 *
 * @returns The loading state.
 */
export function useLoadingState(): boolean {
  return useContext(LoadingStateContext);
}
