import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

import { SkeletonLoader } from '@/components/SkeletonLoader';
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
  const [t] = useTranslation(['common']);
  const { plugin } = usePluginState();
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

              if (plugin?.name) {
                plausible('Install', {
                  plugin: plugin.name,
                });
              }
            }}
            type="button"
          >
            {t('common:install')}
          </button>
        </>
      )}
    />
  );
}
