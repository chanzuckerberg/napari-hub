import clsx from 'clsx';

import { CollectionCoverImage } from './CollectionCoverImage';
import { CollectionInfo } from './CollectionInfo';
import { CollectionPluginList } from './CollectionPluginList';

export function CollectionPage() {
  return (
    <div>
      <CollectionCoverImage />

      <div
        className={clsx(
          'pt-[14px] px-6 pb-6',
          'screen-495:pt-[38px] screen-495:px-12 screen-495:pb-12',

          // Grid layout
          'gap-x-6 screen-495:gap-x-12',
          'grid justify-center grid-cols-2',
          'screen-875:grid-cols-3',
          'screen-1150:grid-cols-napari-5',
        )}
      >
        <CollectionInfo />
        <CollectionPluginList />
      </div>
    </div>
  );
}
