import Skeleton from '@mui/material/Skeleton';
import { ReactNode } from 'react';

import { useLoadingState } from '@/context/loading';

interface Props {
  /**
   * Class to apply to Skeleton loader.
   */
  className?: string;

  /**
   * Children to render when not loading.
   */
  children?: ReactNode;

  /**
   * Render function that returns the node to render when not loading.
   *
   * https://reactjs.org/docs/render-props.html
   *
   * @deprecated Use `children` instead.
   */
  render?(): ReactNode;
}

/**
 * Component that renders a skeleton loader when the global loading state is `true`.
 */
export function SkeletonLoader({
  className,
  children,
  render = () => <></>,
}: Props) {
  const isLoading = useLoadingState();

  if (!isLoading) return <>{children ?? render()}</>;

  return (
    <Skeleton
      className={className}
      data-testid="skeleton-loader"
      variant="rectangular"
    />
  );
}
