import dayjs from 'dayjs';
import { ComponentType, useMemo } from 'react';
import {
  VictoryArea,
  VictoryAxis,
  VictoryGroup,
  VictoryLabel,
  VictoryLabelProps,
  VictoryPortal,
  VictoryScatter,
} from 'victory';

import { useMediaQuery } from '@/hooks';
import { DataPoint } from '@/types/stats';

import { AreaChartLayout } from './AreaChartLayout';
import { AreaChartLine } from './AreaChartLine';
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
    const allZeros = data.every((point) => point.y === 0);

    if (allZeros) {
      return [0.2, 0.4, 0.6, 0.8, 1];
    }

    return undefined;
  }, [data]);

  const allowedXTickValues = useMemo(
    () => new Set(xTicks.filter((_, idx) => idx % 3 === 0)),
    [xTicks],
  );

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
          return allowedXTickValues.has(value)
            ? dayjs(value).format('MMM')
            : '';
        }}
        scale="time"
        tickLabelComponent={
          <VictoryLabel
            dy={-4}
            style={{
              fontFamily: 'Barlow',
              fontSize: isScreen600 ? 24 : 11,
              fontWeight: 400,
            }}
          />
        }
        tickValues={xTicks}
        style={{
          ticks: {
            stroke: '#000',
            size: isScreen600 ? 5 : 3,
          },
        }}
      />

      {/* Y-Axis */}
      <VictoryAxis
        dependentAxis
        crossAxis
        standalone={false}
        tickLabelComponent={
          <VictoryLabel
            style={{
              fontFamily: 'Barlow',
              fontSize: isScreen600 ? 24 : 11,
              fontWeight: 400,
            }}
          />
        }
        label={yLabel}
        axisLabelComponent={
          <VictoryLabel
            dy={isScreen600 ? -40 : -20}
            style={{
              fontFamily: 'Barlow',
              fontSize: isScreen600 ? 24 : 11,
              fontWeight: 400,
            }}
          />
        }
        style={{
          ticks: {
            stroke: '#000',
            size: isScreen600 ? 5 : 3,
          },
        }}
        tickValues={tickValues}
      />
    </AreaChartLayout>
  );
}
