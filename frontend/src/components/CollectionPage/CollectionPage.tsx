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
          'pt-sds-l px-sds-xl pb-[75px]',
          'screen-495:pt-sds-xxl screen-495:px-12',

          // Grid layout
          'gap-x-sds-xl screen-495:gap-x-12',
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
