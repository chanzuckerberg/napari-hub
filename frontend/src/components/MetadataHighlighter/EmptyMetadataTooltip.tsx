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
  name: 'the name of the plugin',
  description: 'long description of the plugin',
  summary: 'short description of the plugin',

  // Plugin metadata
  developmentStatus: 'the current development status of the plugin',
  license: 'the license of the plugin',
  operatingSystems: 'list of supported operating systems',
  pythonVersion: 'indicates which version of Python the user should install',
  requirements: 'list of Python requirements for the plugin',
  version: 'the current version of the plugin',

  // Plugin support info
  authors: 'lists authors of the plugin',
  documentationSite: 'link to the documentation site',
  reportIssues: 'link to site for users to report issues',
  sourceCode: 'link to the source code of the plugin',
  supportSite: 'link to a plugin support site',

  // Currently not used in the preview UI
  twitter: "link to the author's twitter",
  projectSite: 'link to the project site of the plugin',

  // Unused
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
