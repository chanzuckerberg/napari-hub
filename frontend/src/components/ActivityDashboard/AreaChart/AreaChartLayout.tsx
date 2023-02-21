import { ReactNode, useMemo } from 'react';
import { PaddingProps, VictoryChart, VictoryVoronoiContainer } from 'victory';

import { useMediaQuery } from '@/hooks';

interface Props {
  children: ReactNode;
  height?: number;
}

export function AreaChartLayout({ children, height }: Props) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const chartPadding = useMemo<PaddingProps>(
    () => ({
      top: 20,
      left: isScreen600 ? 86 : 55,
      bottom: 48,
      right: 20,
    }),
    [isScreen600],
  );

  return (
    <div className="flex flex-col flex-auto">
      <div className="flex space-x-6">
        <VictoryChart
          containerComponent={<VictoryVoronoiContainer voronoiDimension="x" />}
          padding={chartPadding}
          height={height}
        >
          {children}
        </VictoryChart>
      </div>
    </div>
  );
}
