import { Tooltip } from '@material-ui/core';
import { useSnapshot } from 'valtio';

import { Link } from '@/components/common/Link';
import { MetadataStatus } from '@/components/MetadataStatus';
import { HUB_WIKI_LINK } from '@/constants/preview';
import { MetadataKeys, usePluginMetadata } from '@/context/plugin';
import { previewStore } from '@/store/preview';

interface Props {
  className?: string;
  metadataId?: MetadataKeys;
}

/**
 * Tooltip titles to render for each metadata field on the plugin page.
 */
const TOOLTIP_TEXT: Record<MetadataKeys, string> = {
  // Plugin content
  name: 'There can be only one. This is also the name of your Python package. Learn how to set this.',
  description:
    'Focus on what’s relevant to users who might want to try your plugin. Learn how to set this.',
  summary:
    'Stand out with a concise summary of what your plugin does. Learn how to set this.',

  // Plugin metadata
  developmentStatus:
    'Tell users what level of stability they should expect. Learn how to set this.',
  license:
    'Help users know how they can modify or redistribute your code. Learn how to set this.',
  operatingSystems:
    'Tell your users which operating systems you support. Learn how to set this.',
  pythonVersion:
    'Let users know which Python versions you support. Learn how to set this.',
  requirements:
    'If your plugin has dependencies on other Python libraries, make sure to add them. Learn how to set this.',
  version:
    'Semantic versioning gives users quick insight into breaking changes. Learn how to set this.',

  // Plugin support info
  authors:
    'Make sure folks know who’s behind the magic. Learn how to set this.',
  documentationSite:
    'Show your users where to go to learn about all the awesome things your plugin can do. Learn how to set this.',
  reportIssues:
    'Let users know where to go to request features or report bugs. Learn how to set this.',
  sourceCode:
    'Link to the source code to help build trust in your hard work. Learn how to set this.',
  supportSite:
    'Make sure your users can find someone to help when they need a hand. Learn how to set this.',

  // Currently not used in the preview UI
  twitter: "Link to the Author's Twitter. Learn how to set this.",
  projectSite: 'Link to the Project Site of the Plugin. Learn how to set this.',

  // Unused
  citations: '',
  releaseDate: '',
  firstReleased: '',
};

/**
 * Renders a tooltip and metadata status icon for with information for the
 * metadata specified by `metadataId`.
 */
export function EmptyMetadataTooltip({ className, metadataId }: Props) {
  const snap = useSnapshot(previewStore);
  const metadata = usePluginMetadata();

  if (!metadataId) {
    return null;
  }

  return (
    <Tooltip
      classes={{
        tooltip:
          'bg-white text-black text-sm border-2 border-napari-gray relative',
      }}
      placement="bottom"
      title={
        <>
          <h2 className="font-semibold">{metadata[metadataId].name}</h2>

          {metadataId ? TOOLTIP_TEXT[metadataId] : ''}

          <p className="text-xs mt-5 mb-3">
            Learn how to add content for this field in the{' '}
            <Link className="underline" href={HUB_WIKI_LINK} newTab>
              napari hub GitHub Wiki.
            </Link>
          </p>

          <p className="italic text-xs">
            If this field remains incomplete, it will still be shown on your
            plugin’s page, but without the orange overlay.
          </p>
        </>
      }
      // The `open` prop is not fully reactive when using controlled components
      // for some reason, so we need to use `key` to force unmount / remount of
      // the Tooltip component so that it can react to the tooltip correctly.
      key={snap.activeMetadataField}
      open={
        snap.activeMetadataField
          ? snap.activeMetadataField === metadataId
          : undefined
      }
    >
      <div className={className}>
        <MetadataStatus hasValue={false} />
      </div>
    </Tooltip>
  );
}
