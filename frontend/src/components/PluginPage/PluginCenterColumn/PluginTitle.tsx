import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { EmptyMetadataTooltip } from '@/components/MetadataHighlighter/EmptyMetadataTooltip';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

export function PluginTitle() {
  const [t] = useTranslation(['pluginData']);
  const { plugin } = usePluginState();
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

  return (
    <SkeletonLoader
      className="h-12"
      render={() => (
        <MetadataHighlighter
          metadataId={isNpe2Enabled ? 'metadata-displayName' : 'metadata-name'}
          className="flex justify-between"
          highlight={isNpe2Enabled ? !plugin?.display_name : !plugin?.name}
          tooltip={
            <EmptyMetadataTooltip
              className="self-end"
              metadataId={
                isNpe2Enabled ? 'metadata-displayName' : 'metadata-name'
              }
            />
          }
        >
          <h1
            className={clsx(
              'font-bold text-4xl',
              !plugin?.name && 'text-hub-gray-500',
            )}
          >
            {(isNpe2Enabled ? plugin?.display_name : undefined) ||
              plugin?.name ||
              t('pluginData:labels.pluginName.label')}
          </h1>
        </MetadataHighlighter>
      )}
    />
  );
}
