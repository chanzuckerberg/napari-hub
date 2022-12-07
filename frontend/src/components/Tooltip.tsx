import clsx from 'clsx';
import { Tooltip as SDSTooltip, TooltipProps } from 'czifui';

export function Tooltip({
  leaveDelay = 0,
  arrow = true,
  classes,
  ...props
}: TooltipProps) {
  return (
    <SDSTooltip
      {...props}
      leaveDelay={leaveDelay}
      arrow={arrow}
      classes={{
        ...(arrow
          ? {
              arrow: clsx(
                'before:bg-white before:border before:border-napari-gray',
                classes?.arrow,
              ),

              tooltip: clsx(
                'bg-white text-black border border-napari-gray',
                classes?.tooltip,
              ),
            }
          : {}),

        ...classes,
      }}
    />
  );
}
