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
      className="h-6 my-6"
      render={() => (
        <MetadataHighlighter
          metadataId="metadata-summary"
          className="flex justify-between items-center my-6"
          highlight={!plugin?.summary}
        >
          <h2
            className={clsx(
              'font-semibold text-lg',
              !plugin?.summary && 'text-hub-gray-500',
            )}
          >
            {plugin?.summary || t('pluginData:labels.summary.preview')}
          </h2>
        </MetadataHighlighter>
      )}
    />
  );
}
