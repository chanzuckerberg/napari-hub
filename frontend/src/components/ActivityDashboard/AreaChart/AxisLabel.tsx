import { useMemo } from 'react';
import { VictoryLabel, VictoryLabelProps } from 'victory';

import { useMediaQuery } from '@/hooks';

export function AxisLabel(props: VictoryLabelProps) {
  const { style } = props;

  const isScreen600 = useMediaQuery({ minWidth: 'screen-600' });
  const isScreen875 = useMediaQuery({ minWidth: 'screen-875' });

  const fontSize = useMemo(() => {
    if (isScreen875) {
      return 24;
    }

    if (isScreen600) {
      return 16;
    }

    return 12;
  }, [isScreen600, isScreen875]);

  return (
    <VictoryLabel
      {...props}
      style={{
        ...style,

        fontSize,
        fontFamily: 'Barlow',
        fontWeight: 400,
      }}
    />
  );
}
