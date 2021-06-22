import { Button } from '@material-ui/core';
import { CheckCircle } from '@material-ui/icons';
import clsx from 'clsx';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { useDebouncedCallback } from 'use-debounce';

import { Overlay } from '@/components/common';
import { Fade } from '@/components/common/animations';
import { Close, Copy } from '@/components/common/icons';
import { MediaFragment } from '@/components/common/media';
import { usePluginState } from '@/context/plugin';
import { usePlausible } from '@/hooks';

import styles from './InstallModal.module.scss';

const COPY_FEEDBACK_DEBOUNCE_DURATION_MS = 2_000;

/**
 * Component that renders an inline button for copying the plugin name to the
 * user's clipboard.
 */
function CopyPluginNameButton() {
  const [clicked, setClicked] = useState(false);
  const { plugin } = usePluginState();
  const plausible = usePlausible();

  const setClickDebounced = useDebouncedCallback(
    (value: boolean) => setClicked(value),
    COPY_FEEDBACK_DEBOUNCE_DURATION_MS,
  );

  return (
    <Button
      className={clsx(
        // Button colors
        clicked
          ? 'bg-napari-primary hover:bg-napari-primary'
          : 'bg-napari-light hover:bg-napari-primary',

        // Dimensions
        'h-6',

        // Show button inline with text.
        'inline-flex items-center',
        'text-base',

        // Padding
        'py-px px-1',

        // Animate colors when hovering over button
        'transition-colors',
      )}
      onClick={async () => {
        await navigator.clipboard?.writeText?.(plugin.name);

        // Set `clicked` to true immediately when the user clicks
        if (!clicked) {
          setClicked(true);
        }

        // Set `clicked` to false after 3 seconds. This function is debounced,
        // so if the user clicks on the button again, it'll reset the timeout.
        setClickDebounced(false);

        plausible('Copy Package', {
          plugin: plugin.name,
        });
      }}
    >
      {plugin.name}{' '}
      <span className="ml-2 inline-flex">
        {clicked ? (
          <CheckCircle className="w-4" />
        ) : (
          <Copy className="inline w-4" />
        )}
      </span>
    </Button>
  );
}

interface Closeable {
  /**
   * Callback to close the modal when the user clicks away or clicks the close
   * buttons.
   */
  onClose(): void;
}

/**
 * Component that renders the modal body.  This includes the instructions on
 * how to install the napari plugin and a button to copy the plugin name.
 */
function InstallModalBody({ onClose }: Closeable) {
  return (
    <>
      {/* Header showing title and close button */}
      <header className="flex justify-between mb-9">
        <h2 className="font-bold text-2xl">Installing a plugin with napari</h2>

        {/* Close button */}
        <MediaFragment greaterThanOrEqual="sm">
          <button onClick={onClose} type="button">
            <Close className={styles.closeIcon} />
          </button>
        </MediaFragment>
      </header>

      {/* Numbered list of instructions for installing a plugin */}
      <ol className="list-decimal list-inside font-bold">
        <li>
          <p className="font-normal inline leading-8">
            From the “Plugins” menu within the napari application, select
            “Install/Uninstall Package(s)...”.
          </p>

          <div className="my-3">
            <Image
              src="/images/plugin-install-menu.png"
              alt="napari plugin install menu"
              width={141}
              height={74}
            />
          </div>
        </li>

        <li>
          <p className="font-normal inline leading-8">
            Copy <CopyPluginNameButton /> and paste it where it says “Install by
            name/url…”
          </p>

          <div className="my-3">
            <Image
              src="/images/plugin-list.png"
              alt="napari plugin list"
              width={430}
              height={191}
            />
          </div>
        </li>

        <li>
          <p className="font-normal inline">Click “Install”.</p>
          <p className="font-normal italic text-xs my-6">
            To get started with napari, visit{' '}
            <a
              className="underline hover:text-napari-primary"
              href="https://napari.org"
              target="_blank"
              rel="noreferrer"
            >
              napari.org
            </a>
            .
          </p>
        </li>
      </ol>
    </>
  );
}

interface InstallModalProps extends Closeable {
  /**
   * Determines if the modal should be visible or not.
   */
  visible: boolean;
}

/**
 * Component for rendering the installation modal.  This component handles
 * animating the modal into / out of view, displaying an overlay when the modal
 * is visible, and closing the modal when the user clicks away from it.
 */
export function InstallModal({ onClose, visible }: InstallModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  useClickAway(modalRef, onClose);

  return (
    <>
      <Overlay visible={visible} />

      <div className="absolute min-w-napari-xs">
        <Fade
          className={clsx(
            // White background and drop shadow
            'bg-white shadow-2xl',

            // Add scrollbar if modal contents are too long.
            'overflow-y-auto',

            // Render modal fixed to screen and above everything else
            'fixed z-50',

            // Padding
            'p-6 md:p-12',

            // Dimensions
            'w-5/6 max-w-[775px] max-h-[706px]',

            // Positioning: This centers the modal in the middle of the viewport
            'top-1/2 left-1/2',
            'transform -translate-x-1/2 -translate-y-1/2',
          )}
          ref={modalRef}
          visible={visible}
        >
          <InstallModalBody onClose={onClose} />

          <div className="flex justify-end">
            <button
              className="border-2 py-4 px-6 border-napari-primary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </Fade>
      </div>
    </>
  );
}
