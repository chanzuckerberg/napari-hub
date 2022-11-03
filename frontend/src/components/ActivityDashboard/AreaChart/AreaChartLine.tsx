import { ComponentProps } from 'react';
import { VictoryLabelProps, VictoryTooltip } from 'victory';

import { LineTooltip } from './LineTooltip';
import { PublishedLine } from './PublishedLine';

/**
 * Component for rendering all types of vertical lines on the area chart. This
 * is composed into a single component so that we can leverage for rendering
 * different types of vertical lines.
 */
export function AreaChartLine(props: VictoryLabelProps) {
  return (
    <>
      <PublishedLine {...props} />
      <LineTooltip {...(props as ComponentProps<typeof VictoryTooltip>)} />
    </>
  );
}
