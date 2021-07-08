import clsx from 'clsx';
import { useState } from 'react';

import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';

import { InstallModal } from './InstallModal';

interface Props {
  className?: string;
}

/**
 * Component that renders the CTA button and installation modal.  Clicking the
 * install button will render the modal visible.
 */
export function CallToActionButton({ className }: Props) {
  const { plugin } = usePluginState();
  const plausible = usePlausible();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <InstallModal onClose={() => setVisible(false)} visible={visible} />

      <button
        className={clsx(
          className,

          // Button color
          'bg-napari-primary',

          // Dimensions
          'h-12 w-full lg:max-w-napari-col',
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
  );
}
