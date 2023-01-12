import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import { SkeletonLoader } from '@/components/SkeletonLoader';

export function PluginViewProjectDataLink() {
  const [t] = useTranslation(['pluginPage']);

  return (
    <div className="screen-1425:hidden mt-sds-xl mb-sds-xxl">
      <SkeletonLoader
        className="h-8 w-24"
        render={() => (
          <a
            className={clsx(
              // Text styling
              'underline hover:text-hub-primary-400',

              /*
                  Top margins: This is used for smaller layouts because the CTA
                  button is above the metadata link.
                */
              'mt-sds-xl',

              /*
                  Left margins: This is used when the CTA and metadata link are
                  inline.  The margin is removed when the CTA moves to the right
                  column on 1150px layouts.
                */
              // 'screen-600:ml-12 screen-1150:ml-0',
            )}
            href="#pluginMetadata"
          >
            {t('pluginPage:viewProjectData')}
          </a>
        )}
      />
    </div>
  );
}
