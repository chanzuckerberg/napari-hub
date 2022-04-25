import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import CheckCircle from '@material-ui/icons/CheckCircle';
import clsx from 'clsx';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { I18n } from '@/components/I18n';
import { Close, Copy } from '@/components/icons';
import { Media } from '@/components/media';
import { usePluginMetadata } from '@/context/plugin';
import { usePlausible } from '@/hooks';

import styles from './InstallModal.module.scss';

const COPY_FEEDBACK_DEBOUNCE_DURATION_MS = 2_000;

/**
 * Component that renders an inline button for copying the plugin name to the
 * user's clipboard.
 */
function CopyPluginNameButton() {
  const [clicked, setClicked] = useState(false);
  const metadata = usePluginMetadata();
  const plausible = usePlausible();

  const setClickDebounced = useDebouncedCallback(
    (value: boolean) => setClicked(value),
    COPY_FEEDBACK_DEBOUNCE_DURATION_MS,
  );

  const pluginName = metadata.name.value || metadata.name.label;

  return (
    <Button
      className={clsx(
        // Button colors
        clicked
          ? 'bg-napari-primary hover:bg-napari-primary'
          : 'bg-napari-light hover:bg-napari-primary',

        // Dimensions
        'min-h-6',

        // Show button inline with text.
        'inline-flex items-center',
        'text-base',

        // Padding
        'py-px px-1',

        // Animate colors when hovering over button
        'transition-colors',
      )}
      onClick={async () => {
        // Set `clicked` to true immediately when the user clicks
        if (!clicked) {
          setClicked(true);
        }

        // Set `clicked` to false after 3 seconds. This function is debounced,
        // so if the user clicks on the button again, it'll reset the timeout.
        setClickDebounced(false);

        await navigator.clipboard?.writeText?.(pluginName);

        plausible('Copy Package', {
          plugin: pluginName,
        });
      }}
    >
      <span>{pluginName}</span>

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

function InstallModalHeader({ onClose }: Closeable) {
  const [t] = useTranslation(['pluginPage']);

  return (
    <header className="flex justify-between mb-6 pt-6 px-6">
      <h2 className="font-bold text-2xl screen-495:ml-6 mt-6">
        {t('pluginPage:installModal.title')}
      </h2>

      {/* Close button */}
      <Media greaterThanOrEqual="sm">
        <IconButton onClick={onClose}>
          <Close className={styles.closeIcon} />
        </IconButton>
      </Media>
    </header>
  );
}

/**
 * Component that renders the modal body.  This includes the instructions on
 * how to install the napari plugin and a button to copy the plugin name.
 */
function InstallModalBody() {
  const [t] = useTranslation(['pluginPage']);

  return (
    <ol className="list-decimal font-bold px-6 screen-495:px-12 leading-normal">
      <li>
        <p className="font-normal inline">
          {t('pluginPage:installModal.steps.step1')}
        </p>

        <div className="my-3">
          <Image
            src="/images/plugin-install-menu.png"
            alt={t('pluginPage:alt.installMenu')}
            width={141}
            height={74}
          />
        </div>
      </li>

      <li>
        <p className="font-normal inline">
          <I18n
            i18nKey="pluginPage:installModal.steps.step2"
            components={{
              copyButton: <CopyPluginNameButton />,
            }}
          />
        </p>

        <div className="my-3">
          <Image
            src="/images/plugin-list.png"
            alt={t('pluginPage:alt.pluginList')}
            width={430}
            height={191}
          />
        </div>
      </li>

      <li>
        <p className="font-normal inline">
          {t('pluginPage:installModal.steps.step3')}
        </p>
        <p className="font-normal italic text-xs my-6">
          <I18n i18nKey="pluginPage:installModal.visitNapari" />
        </p>
      </li>
    </ol>
  );
}

function InstallModalFooter({ onClose }: Closeable) {
  const [t] = useTranslation(['common']);

  return (
    <div className="flex justify-end p-6 screen-495:p-12 pt-0 screen-495:pt-0">
      <Button
        className="border-2 border-napari-primary py-3 px-6"
        onClick={onClose}
        variant="outlined"
      >
        {t('common:close')}
      </Button>
    </div>
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
  return (
    <Dialog
      aria-labelledby="modal-title"
      aria-describedby="modal-content"
      className="flex items-center justify-center"
      classes={{
        paper: clsx(
          styles.modal,

          // Override MUI margins
          'mx-6',
        ),
      }}
      open={visible}
      onClose={onClose}
    >
      <InstallModalHeader onClose={onClose} />
      <InstallModalBody />
      <InstallModalFooter onClose={onClose} />
    </Dialog>
  );
}
