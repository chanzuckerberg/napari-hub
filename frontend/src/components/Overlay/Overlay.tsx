import clsx from 'clsx';

import { Fade } from '@/components/animations';

interface Props {
  visible?: boolean;
}

/**
 * Screen overlay that animates in and out of view.
 */
export function Overlay({ visible = false }: Props) {
  return (
    <Fade
      data-testid="overlay"
      className={clsx(
        // Colors
        'bg-black bg-opacity-50',

        // Dimensions
        'w-screen h-screen',

        // Positioning
        'fixed top-0 right-0',

        // Z-index
        'z-40',
      )}
      visible={visible}
    />
  );
}
