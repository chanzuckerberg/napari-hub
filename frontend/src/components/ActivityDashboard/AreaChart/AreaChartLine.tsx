import { ComponentType } from 'react';
import { VictoryLabelProps } from 'victory';

interface Props extends VictoryLabelProps {
  lineComponents: ComponentType<VictoryLabelProps>[];
}

/**
 * Component for rendering all types of vertical lines on the area chart. This
 * is composed into a single component so that we can leverage for rendering
 * different types of vertical lines.
 */
export function AreaChartLine({ lineComponents, ...props }: Props) {
  return (
    <>
      {lineComponents.map((LineComponent) => (
        <LineComponent key={LineComponent.displayName} {...props} />
      ))}
    </>
  );
}
