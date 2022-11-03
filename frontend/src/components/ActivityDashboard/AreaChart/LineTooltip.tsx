import { VictoryLabel, VictoryLabelProps, VictoryTooltipProps } from 'victory';

import { DataPoint } from '@/types/stats';

export function LineTooltip(props: VictoryTooltipProps) {
  const { x = 0, datum, active } = props;
  const point = datum as DataPoint;

  if (!active || point.y === null) {
    return null;
  }

  return (
    <g>
      <line
        transform={`translate(${x ?? 0}, 55)`}
        x1={0}
        y2={-40}
        y1={200}
        stroke={active ? '#000' : 'transparent'}
        strokeWidth={1}
      />

      <VictoryLabel
        {...(props as VictoryLabelProps)}
        y={10}
        style={{
          fontFamily: 'Barlow',
          fontSize: 24,
          fontWeight: 600,
        }}
      />
    </g>
  );
}
