import dayjs from 'dayjs';
import { ComponentType, useMemo } from 'react';
import {
  VictoryArea,
  VictoryAxis,
  VictoryAxisCommonProps,
  VictoryGroup,
  VictoryLabelProps,
  VictoryPortal,
  VictoryScatter,
} from 'victory';

import { FormatType, useMediaQuery, useNumberFormatter } from '@/hooks';
import { DataPoint } from '@/types/stats';

import { AreaChartLayout } from './AreaChartLayout';
import { AreaChartLine } from './AreaChartLine';
import { AxisLabel } from './AxisLabel';
import { LineTooltip } from './LineTooltip';
import { ScatterPoint } from './ScatterPoint';

interface Props {
  data: DataPoint[];
  fill?: string;
  yLabel?: string;
  height?: number;
  lineComponents?: ComponentType<VictoryLabelProps>[];
  xTicks: number[];
}

// Only show January, April, July, and October on x-axis
const X_TICK_ALLOWED_MONTHS = new Set([0, 3, 6, 9]);

export function AreaChart({
  data,
  fill = '#d2efff',
  yLabel,
  height,
  lineComponents = [LineTooltip],
  xTicks,
}: Props) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });

  const tickValues = useMemo(() => {
    const isAllZerosOrNulls = data.every(
      (point) => point.y === 0 || point.y === null,
    );

    if (isAllZerosOrNulls) {
      return [0.2, 0.4, 0.6, 0.8, 1];
    }

    return undefined;
  }, [data]);

  const axisStyle = useMemo<VictoryAxisCommonProps['style']>(
    () => ({
      ticks: {
        stroke: '#000',
        size: 3,
      },
    }),
    [],
  );

  const yAxisTickFormatter = useNumberFormatter(FormatType.Short);

  return (
    <AreaChartLayout height={height}>
      <VictoryGroup data={data}>
        {/* Line + Area chart */}
        <VictoryArea
          style={{
            data: {
              fill,
              stroke: '#000',
              strokeWidth: 1,
            },
          }}
        />

        {/* Line points */}
        <VictoryPortal>
          <VictoryScatter
            dataComponent={<ScatterPoint />}
            labels={({ datum }) => (datum as DataPoint).y}
            labelComponent={<AreaChartLine lineComponents={lineComponents} />}
          />
        </VictoryPortal>
      </VictoryGroup>

      {/* X-Axis */}
      <VictoryAxis
        crossAxis
        standalone={false}
        maxDomain={{
          x: dayjs().subtract(2, 'month').endOf('month').toDate().getTime(),
        }}
        tickFormat={(value: number) => {
          const date = dayjs(value);

          return X_TICK_ALLOWED_MONTHS.has(date.get('month'))
            ? date.format('MMM')
            : '';
        }}
        scale="time"
        tickLabelComponent={<AxisLabel dy={-4} />}
        tickValues={xTicks}
        style={axisStyle}
      />

      {/* Y-Axis */}
      <VictoryAxis
        dependentAxis
        crossAxis
        standalone={false}
        tickLabelComponent={<AxisLabel />}
        label={yLabel}
        tickFormat={yAxisTickFormatter.format}
        axisLabelComponent={<AxisLabel dy={isScreen600 ? -40 : -20} />}
        style={axisStyle}
        tickValues={tickValues}
      />
    </AreaChartLayout>
  );
}
