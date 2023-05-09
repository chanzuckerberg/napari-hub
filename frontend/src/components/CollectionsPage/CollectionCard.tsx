import clsx from 'clsx';
import Image from 'next/image';

import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
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
      className="hover:bg-hub-gray-100 focus:bg-hub-gray-100"
      href={`/collections/${collection.symbol}`}
    >
      <div className="relative w-full h-[50px] screen-495:h-[100px]">
        <Image
          className="object-cover"
          src={collection.thumb_image}
          alt={`${collection.title} thumbnail image`}
          layout="fill"
        />
      </div>

      <Text
        className={clsx(
          'my-[10px] screen-495:my-[20px]',
          LINE_HEIGHT_CLASS_NAME,
        )}
        variant="h4"
      >
        {collection.title}
      </Text>
      <Text variant="bodyS">{collection.summary}</Text>

      <Text
        className={clsx(
          'space-x-sds-xxs mt-sds-m screen-495:mt-sds-xl',
          LINE_HEIGHT_CLASS_NAME,
        )}
        variant="bodyXS"
      >
        <span className="font-semibold">{collection.curator.name}</span>
        <span>{collection.curator.affiliation.institution}</span>
      </Text>
    </Link>
  );
}
