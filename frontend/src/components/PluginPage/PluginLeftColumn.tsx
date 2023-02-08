import { useMediaQuery } from '@/hooks';

import { PluginMetadata } from './PluginMetadata';

export function PluginLeftColumn() {
  const hasPluginMetadataScroll = useMediaQuery({ minWidth: 'screen-1425' });

  return (
    <PluginMetadata
      enableScrollID={hasPluginMetadataScroll}
      className="hidden screen-1425:block"
    />
  );
}
