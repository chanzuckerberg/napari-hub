import clsx from 'clsx';

import { SupportInfo } from '@/components/PluginPage/SupportInfo';
import { SkeletonLoader } from '@/components/SkeletonLoader';

export function PluginActions() {
  return (
    <div
      className={clsx(
        'flex screen-1150:hidden',
        'gap-x-sds-xxxl gap-y-sds-xl',
        'flex-col screen-495:flex-row screen-495:items-center',
        'mt-sds-xl',
      )}
    >
      <SkeletonLoader
        className="h-[40px] w-[100px]"
        render={() => <SupportInfo />}
      />
    </div>
  );
}
