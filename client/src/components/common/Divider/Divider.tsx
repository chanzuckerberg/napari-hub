import clsx from 'clsx';

interface Props {
  className?: string;
}

/**
 * Component for rendering 1px divider.
 */
export function Divider({ className }: Props) {
  return <div className={clsx(className, 'h-px bg-black border-none')} />;
}
