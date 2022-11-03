import { ReactNode, useMemo } from 'react';
import { PaddingProps, VictoryChart, VictoryVoronoiContainer } from 'victory';

import { useAreaChartState } from './context';

interface Props {
  children: ReactNode;
}

export function AreaChartLayout({ children }: Props) {
  const { isScreen600 } = useAreaChartState();
  const chartPadding = useMemo<PaddingProps>(
    () => ({
      top: 20,
      left: isScreen600 ? 86 : 55,
      bottom: 48,
      right: 0,
    }),
    [isScreen600],
  );

  return (
    <div className="flex flex-col">
      <div className="flex space-x-6">
        <VictoryChart
          containerComponent={<VictoryVoronoiContainer voronoiDimension="x" />}
          padding={chartPadding}
        >
          {children}
        </VictoryChart>
      </div>
    </div>
  );
}
