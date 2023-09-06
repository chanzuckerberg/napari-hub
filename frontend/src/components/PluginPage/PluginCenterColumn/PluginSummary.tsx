import clsx from 'clsx';

import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';

export function PluginSummary() {
  const { plugin } = usePluginState();

  return (
    <SkeletonLoader className="h-6 mt-sds-l screen-495:mt-sds-xl mb-sds-m screen-495:mb-sds-l">
      <div className="flex justify-between items-center my-6">
        <h2
          className={clsx('text-lg', !plugin?.summary && 'text-hub-gray-500')}
        >
          {plugin?.summary}
        </h2>
      </div>
    </SkeletonLoader>
  );
}
