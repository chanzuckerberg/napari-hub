import clsx from 'clsx';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { usePlausible } from '@/hooks';
import { pluginState } from '@/store/plugin';

import { SkeletonLoader } from '../common';
import { InstallModal } from './InstallModal';

interface Props {
  className?: string;
}

/**
 * Component that renders the CTA button and installation modal.  Clicking the
 * install button will render the modal visible.
 */
export function CallToActionButton({ className }: Props) {
  const [plugin] = useAtom(pluginState);
  const plausible = usePlausible();
  const [visible, setVisible] = useState(false);

  const dimensionsClassName = 'h-12 w-full screen-600:max-w-napari-col';

  return (
    <SkeletonLoader
      className={dimensionsClassName}
      render={() => (
        <>
          <InstallModal onClose={() => setVisible(false)} visible={visible} />

          <button
            className={clsx(
              className,

              // Button color
              'bg-napari-primary',

              // Dimensions
              dimensionsClassName,
            )}
            onClick={() => {
              setVisible(true);
              plausible('Install', {
                plugin: plugin.name,
              });
            }}
            type="button"
          >
            Install
          </button>
        </>
      )}
    />
  );
}
