import { createContext, ReactNode, useContext, useMemo } from 'react';

interface AreaChartStateValue {
  publicReleaseX: number;
  isScreen600: boolean;
  visibleMonths: number[];
}

const AreaChartStateContext = createContext<AreaChartStateValue>({
  publicReleaseX: 0,
  isScreen600: false,
  visibleMonths: [],
});

interface Props extends AreaChartStateValue {
  children: ReactNode;
}

/**
 * Provider for sharing state used in the area chart component.
 */
export function AreaChartStateProvider({
  children,
  isScreen600,
  publicReleaseX,
  visibleMonths,
}: Props) {
  const value = useMemo<AreaChartStateValue>(
    () => ({
      publicReleaseX,
      isScreen600,
      visibleMonths,
    }),
    [isScreen600, publicReleaseX, visibleMonths],
  );

  return (
    <AreaChartStateContext.Provider value={value}>
      {children}
    </AreaChartStateContext.Provider>
  );
}

export function useAreaChartState(): AreaChartStateValue {
  return useContext(AreaChartStateContext);
}
