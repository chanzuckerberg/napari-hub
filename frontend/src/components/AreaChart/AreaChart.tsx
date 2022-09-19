/* eslint-disable no-underscore-dangle */

import dayjs from 'dayjs';
import { maxBy, minBy } from 'lodash';
import { ComponentProps } from 'react';
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryPortal,
  VictoryScatter,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from 'victory';

import { DataPoint } from '@/types/stats';

function ScatterPoint({
  x,
  y,
  datum,
  startX,
}: {
  startX?: number;
  x?: number;
  y?: number;
  datum?: { _x: number; _y: number };
}) {
  return (
    <>
      <circle cx={x} cy={y} r={1.5} fill="#000" />

      {datum?._x === startX && (
        <circle cx={x} cy={y} r={3} fill="transparent" stroke="#000" />
      )}
    </>
  );
}

function LineTooltip(props: ComponentProps<typeof VictoryTooltip>) {
  const { x = 0, datum, active } = props;
  const point = datum as DataPoint;

  if (!active || point.y === null) {
    return null;
  }

  return (
    <g>
      <line
        transform={`translate(${x ?? 0}, 50)`}
        x1={0}
        y2={-20}
        y1={200}
        stroke={active ? '#000' : 'transparent'}
        strokeWidth={1}
      />

      <VictoryLabel
        {...(props as ComponentProps<typeof VictoryLabel>)}
        y={30}
      />
    </g>
  );
}

interface Props {
  data: DataPoint[];
  fill?: string;
  timeseries?: boolean;
  yLabel?: string;
}

export function AreaChart({
  data,
  fill = '#d2efff',
  timeseries,
  yLabel,
}: Props) {
  const tickValues = Array.from(Array(14)).map((_, idx) =>
    dayjs().subtract(idx, 'month').startOf('month').toDate().getTime(),
  );

  const start = data.some((value) => value.y === null)
    ? data.find((value) => value.y)
    : undefined;
  const startX = start?.x;

  return (
    <div className="flex flex-col">
      <div className="flex space-x-6">
        <VictoryChart
          containerComponent={<VictoryVoronoiContainer voronoiDimension="x" />}
        >
          <VictoryAxis
            crossAxis
            domain={[
              minBy(data, (value) => value.x)?.x ?? 0,
              maxBy(data, (value) => value.x)?.x ?? 0,
            ]}
            standalone={false}
            tickFormat={(value: number) =>
              timeseries ? dayjs(value).format('MM/YY') : value
            }
            scale={timeseries ? 'time' : 'linear'}
            tickLabelComponent={
              <VictoryLabel
                dy={-4}
                style={{
                  fontFamily: 'Barlow',
                  fontSize: 8,
                  fontWeight: 400,
                }}
              />
            }
            tickValues={tickValues}
          />

          <VictoryAxis
            dependentAxis
            crossAxis
            domain={[0, maxBy(data, (value) => value.y)?.y ?? 0]}
            standalone={false}
            tickLabelComponent={
              <VictoryLabel
                style={{
                  fontFamily: 'Barlow',
                  fontSize: 11,
                  fontWeight: 400,
                }}
              />
            }
            label={yLabel}
            axisLabelComponent={
              <VictoryLabel
                dy={-10}
                style={{
                  fontFamily: 'Barlow',
                  fontSize: 11,
                  fontWeight: 400,
                }}
              />
            }
          />

          <VictoryGroup data={data}>
            <VictoryArea
              style={{
                data: {
                  fill,
                  stroke: '#000',
                  strokeWidth: 1,
                },
              }}
            />

            <VictoryPortal>
              <VictoryScatter
                dataComponent={<ScatterPoint />}
                labels={({ datum }) => (datum as DataPoint).y}
                labelComponent={
                  <LineTooltip
                    style={{
                      fontFamily: 'Barlow',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                }
              />
            </VictoryPortal>

            {start && (
              <VictoryPortal>
                <VictoryScatter
                  data={[start]}
                  style={{
                    labels: {
                      fontSize: 9,
                    },
                  }}
                  labelComponent={<VictoryLabel dy={8} dx={-20} />}
                  labels={({ datum }) =>
                    startX === (datum as DataPoint).x
                      ? ['Added', 'to hub']
                      : null
                  }
                  dataComponent={<ScatterPoint startX={startX} />}
                />
              </VictoryPortal>
            )}
          </VictoryGroup>
        </VictoryChart>
      </div>
    </div>
  );
}
