import { useTranslation } from 'react-i18next';

import { Markdown } from '@/components/Markdown';
import { MetadataHighlighter } from '@/components/MetadataHighlighter';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';
import { useMediaQuery } from '@/hooks';

import { CallToActionButton } from './CallToActionButton';
import { CitationInfo } from './CitationInfo';
import { PluginMetadata } from './PluginMetadata';

/**
 * Current layout of the plugin page that includes the description, citation,
 * and activity dashboard. This component will be deprecated as when the
 * activity dashboard is fully rolled out to production.
 */
export function PluginPageContent() {
  const { plugin, isEmptyDescription } = usePluginState();
  const [t] = useTranslation(['preview']);
  const hasPluginMetadataScroll = useMediaQuery({ maxWidth: 'screen-1425' });

  return (
    <>
      <SkeletonLoader
        className="h-[600px] mb-sds-xxl"
        render={() => (
          <MetadataHighlighter
            metadataId="metadata-description"
            className="flex items-center justify-between mb-sds-xxl"
            highlight={isEmptyDescription}
          >
            <Markdown disableHeader placeholder={isEmptyDescription}>
              {plugin?.description || t('preview:emptyDescription')}
            </Markdown>
          </MetadataHighlighter>
        )}
      />

      <div className="mb-6 screen-495:mb-12 screen-1150:mb-20">
        <CallToActionButton />
        {plugin?.citations && <CitationInfo className="mt-sds-xxl" />}
      </div>

      <PluginMetadata
        enableScrollID={hasPluginMetadataScroll}
        className="screen-1425:hidden"
        inline
      />
    </>
  );
}
