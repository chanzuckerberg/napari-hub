import clsx from 'clsx';
import Image from 'next/image';

import { Link } from '@/components/Link';
import { CollectionIndexData } from '@/types/collections';

interface Props {
  collection: CollectionIndexData;
}

/**
 * Shared line height class names for text.
 * TODO Extract this to design system
 */
const LINE_HEIGHT_CLASS_NAME = 'leading-[150%] screen-495:leading-[125%]';

/**
 * Renders an image, title, summary, and curator for a collection on the
 * collection home page.
 */
export function CollectionCard({ collection }: Props) {
  return (
    <Link
      className="hover:bg-napari-hover-gray focus:bg-napari-hover-gray"
      href={`/collections/${collection.symbol}`}
    >
      <div className="relative w-full h-[50px] screen-495:h-[100px]">
        <Image
          className="object-cover"
          src={collection.cover_image}
          alt={`${collection.title} cover image`}
          layout="fill"
        />
      </div>

      <h2
        className={clsx(
          'my-[10px] screen-495:my-[20px]',
          'font-semibold text-[11px] screen-495:text-[17px]',
          LINE_HEIGHT_CLASS_NAME,
        )}
      >
        {collection.title}
      </h2>
      <p
        className={clsx(
          'text-[11px] screen-495:text-[14px]',
          LINE_HEIGHT_CLASS_NAME,
        )}
      >
        {collection.summary}
      </p>

      <p
        className={clsx(
          'space-x-1 mt-[10px] screen-495:mt-[20px]',
          'text-[9px] screen-495:text-[11px]',
          LINE_HEIGHT_CLASS_NAME,
        )}
      >
        <span className="font-semibold">{collection.curator.name}</span>
        <span>{collection.curator.affiliation.institution}</span>
      </p>
    </Link>
  );
}
