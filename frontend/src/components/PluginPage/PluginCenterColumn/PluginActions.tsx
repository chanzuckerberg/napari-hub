import clsx from 'clsx';

import { CallToActionButton } from '@/components/PluginPage/CallToActionButton';
import { SupportInfo } from '@/components/PluginPage/SupportInfo';
import { SkeletonLoader } from '@/components/SkeletonLoader';

import { PluginViewProjectDataLink } from './PluginViewProjectDataLink';

export function PluginActions() {
  return (
    <div
      className={clsx(
        // Layout
        'flex screen-1150:hidden flex-col max-w-[401px]',

        // Margins
        'my-sds-xl',
      )}
    >
      <div
        className={clsx(
          'flex gap-x-sds-xxxl gap-y-sds-xl',
          'flex-col screen-495:flex-row screen-495:items-center',
        )}
      >
        <CallToActionButton />

        <SkeletonLoader className="h-[228px]" render={() => <SupportInfo />} />
      </div>

      <PluginViewProjectDataLink />
    </div>
  );
}
