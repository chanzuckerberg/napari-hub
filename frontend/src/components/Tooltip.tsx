import clsx from 'clsx';
import { Tooltip as SDSTooltip, TooltipProps } from 'czifui';

interface Props extends TooltipProps {
  border?: boolean;
}

export function Tooltip({
  leaveDelay = 0,
  arrow = true,
  border = true,
  classes,
  ...props
}: Props) {
  return (
    <SDSTooltip
      {...props}
      leaveDelay={leaveDelay}
      arrow={arrow}
      classes={{
        ...(arrow
          ? {
              arrow: clsx(
                'before:bg-white',
                border && ' before:border before:border-napari-gray',
                classes?.arrow,
              ),

              tooltip: clsx(
                'bg-white text-black',
                border && 'border border-napari-gray',
                classes?.tooltip,
              ),
            }
          : {}),

        ...classes,
      }}
    />
  );
}
