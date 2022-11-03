import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  VictoryArea,
  VictoryAxis,
  VictoryGroup,
  VictoryLabel,
  VictoryPortal,
  VictoryScatter,
} from 'victory';

import { usePluginState } from '@/context/plugin';
import { useMediaQuery } from '@/hooks';
import { DataPoint } from '@/types/stats';

import { AreaChartLayout } from './AreaChartLayout';
import { AreaChartLine } from './AreaChartLine';
import { AreaChartStateProvider } from './context';
import { ScatterPoint } from './ScatterPoint';
import { useChartData } from './useChartData';
import { useVisibleMonthsTicks } from './useVisibleMonthsTicks';

interface Props {
  data: DataPoint[];
  fill?: string;
  yLabel?: string;
}

function usePublicRelease() {
  const { plugin } = usePluginState();
  const publicRelease = dayjs(plugin?.release_date).endOf('month');
  const publicReleaseX = publicRelease.toDate().getTime();

  return { publicRelease, publicReleaseX };
}

export function AreaChart({ data, fill = '#d2efff', yLabel }: Props) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });

  const { publicRelease, publicReleaseX } = usePublicRelease();
  const visibleMonths = useVisibleMonthsTicks();
  const chartData = useChartData(data, publicRelease, visibleMonths);

  const allowedXTickValues = useMemo(
    () => new Set(visibleMonths.filter((_, idx) => idx % 3 === 0)),
    [visibleMonths],
  );

  return (
    <AreaChartStateProvider
      publicReleaseX={publicReleaseX}
      isScreen600={isScreen600}
      visibleMonths={visibleMonths}
    >
      <AreaChartLayout>
        <VictoryGroup data={chartData}>
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
              labelComponent={<AreaChartLine />}
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
          tickValues={visibleMonths}
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
        />
      </AreaChartLayout>
    </AreaChartStateProvider>
  );
}
