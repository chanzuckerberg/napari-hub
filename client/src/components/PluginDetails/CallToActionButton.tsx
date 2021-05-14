import clsx from 'clsx';
import { useState } from 'react';

import { InstallModal } from './InstallModal';

interface Props {
  className?: string;
}

/**
 * Component that renders the CTA button and installation modal.  Clicking the
 * install button will render the modal visible.
 */
export function CallToActionButton({ className }: Props) {
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
        onClick={() => setVisible(true)}
        type="button"
      >
        Install
      </button>
    </>
  );
}
