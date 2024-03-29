import { useMemo } from 'react';
import { VictoryLabel, VictoryLabelProps, VictoryTooltipProps } from 'victory';

import { useFormattedNumber, useMediaQuery } from '@/hooks';
import { DataPoint } from '@/types/metrics';

export function LineTooltip(props: VictoryLabelProps) {
  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const { x = 0, datum, active } = props as VictoryTooltipProps;
  const point = datum as DataPoint;

  const formattedY = useFormattedNumber(point.y);
  const formattedDataPoint = useMemo(
    () => ({
      ...datum,
      y: formattedY,
    }),
    [datum, formattedY],
  );

  if (!active || point.y === null) {
    return null;
  }

  return (
    <g>
      <line
        transform={`translate(${x ?? 0}, 55)`}
        x1={0}
        y2={-50}
        y1={isScreen600 ? 140 : 80}
        stroke={active ? '#000' : 'transparent'}
        strokeWidth={1}
      />

      <VictoryLabel
        {...props}
        datum={formattedDataPoint}
        y={10}
        style={{
          fontFamily: 'Barlow',
          fontSize: isScreen600 ? 24 : 12,
          fontWeight: 600,
        }}
      />
    </g>
  );
}
