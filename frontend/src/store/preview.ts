import { proxy } from 'valtio';

import { MetadataId } from '@/context/plugin';

export const previewStore = proxy({
  /**
   * Currently focused metadata field. This is used for rendering the focus
   * border and opening the tooltip.
   */
  activeMetadataField: '' as MetadataId | '',
});
