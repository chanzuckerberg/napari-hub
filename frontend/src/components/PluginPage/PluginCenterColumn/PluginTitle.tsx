import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';

export function PluginTitle() {
  const [t] = useTranslation(['pluginData']);
  const { plugin } = usePluginState();

  return (
    <SkeletonLoader className="h-12">
      <div className="flex justify-between">
        <h1
          className={clsx(
            'font-bold text-4xl',
            !plugin?.name && 'text-hub-gray-500',
          )}
        >
          {plugin?.display_name ||
            plugin?.name ||
            t('pluginData:labels.pluginName.label')}
        </h1>
      </div>
    </SkeletonLoader>
  );
}
