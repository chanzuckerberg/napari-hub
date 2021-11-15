import Skeleton from '@material-ui/lab/Skeleton';
import { ReactNode } from 'react';

import { useLoadingState } from '@/context/loading';

interface Props {
  /**
   * Class to apply to Skeleton loader.
   */
  className?: string;

  /**
   * Render function that returns the node to render when not loading.
   *
   * https://reactjs.org/docs/render-props.html
   */
  render(): ReactNode;
}

/**
 * Component that renders a skeleton loader when the global loading state is `true`.
 */
export function SkeletonLoader({ className, render }: Props) {
  const isLoading = useLoadingState();
  if (!isLoading) return <>{render()}</>;
  return (
    <Skeleton
      className={className}
      data-testid="skeleton-loader"
      variant="rect"
    />
  );
}
