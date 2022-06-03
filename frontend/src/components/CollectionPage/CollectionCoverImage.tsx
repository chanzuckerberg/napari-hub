import Image from 'next/image';

import { useCollection } from './context';

export function CollectionCoverImage() {
  const collection = useCollection();

  return (
    <div className="relative w-full h-[75px] screen-495:h-[150px]">
      <Image
        className="object-cover"
        src={collection.cover_image}
        alt={`${collection.title} cover image`}
        layout="fill"
      />
    </div>
  );
}
