import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';

export function PluginSummary() {
  const [t] = useTranslation(['pluginData']);
  const { plugin } = usePluginState();

  return (
    <SkeletonLoader
      className="h-6 mt-sds-l screen-495:mt-sds-xl mb-sds-m screen-495:mb-sds-l"
      render={() => (
        <MetadataHighlighter
          metadataId="metadata-summary"
          className="flex justify-between items-center my-6"
          highlight={!plugin?.summary}
        >
          <h2
            className={clsx('text-lg', !plugin?.summary && 'text-hub-gray-500')}
          >
            {plugin?.summary || t('pluginData:labels.summary.preview')}
          </h2>
        </MetadataHighlighter>
      )}
    />
  );
}
