import { useEffect, useRef } from 'react';
import { useSnapshot } from 'valtio';

import { MetadataKeys } from '@/context/plugin';
import { previewStore } from '@/store/preview';
import { setUrlHash } from '@/utils';

/**
 * Hook that registers a click away listener for a particular metadata field.
 * The handler is only registered if the `id` matches the current active
 * metadata ID. When the user clicks outside of the metadata field, the preview
 * page will automatically defocus the field.
 *
 * @param id The ID of the field to check for in the click away handler.
 */
export function usePreviewClickAway(id: MetadataKeys | undefined) {
  const snap = useSnapshot(previewStore);
  const handleClickAwayRef = useRef(() => {
    // Clear active metadata field for the current metadata if the IDs match.
    if (previewStore.activeMetadataField === id) {
      previewStore.activeMetadataField = '';
      setUrlHash('');
    }
  });

  useEffect(() => {
    const handleClickAway = handleClickAwayRef.current;

    if (
      process.env.PREVIEW &&
      snap.activeMetadataField &&
      id === snap.activeMetadataField
    ) {
      setTimeout(() => {
        document.addEventListener('click', handleClickAway);
      });
    }

    return () => document.removeEventListener('click', handleClickAway);
  }, [id, snap.activeMetadataField]);
}
