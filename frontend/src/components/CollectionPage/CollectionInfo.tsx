import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { Link } from 'src/components/Link';

import { Text } from '@/components/Text';
import { formatDate } from '@/utils';

import { CollectionLinks } from './CollectionLinks';
import { useCollection } from './context';

export function CollectionInfo() {
  const { t } = useTranslation(['collections']);
  const collection = useCollection();
  const { curator } = collection;
  const { affiliation } = curator;

  return (
    <div
      className={clsx(
        'col-span-2 screen-875:col-span-3 screen-1150:col-span-3',
        'screen-1150:col-start-2',
      )}
    >
      <h1
        className={clsx(
          'font-bold',
          'leading-[130%] screen-495:leading-[125%]',
          'text-[23px] screen-495:text-[45px]',
        )}
      >
        {collection.title}
      </h1>

      <Text
        className="mt-sds-xl screen-495:mt-sds-xxl"
        element="p"
        variant="h2"
      >
        {collection.description}
      </Text>

      <Text className="space-x-sds-xxs mt-sds-xl" variant="bodyS">
        <strong>{curator.name}</strong>
        <span>{curator.title},</span>

        {affiliation.website ? (
          <span>{affiliation.institution}</span>
        ) : (
          <Link className="underline" href={affiliation.website}>
            {affiliation.institution}
          </Link>
        )}
      </Text>

      <CollectionLinks />

      <Text className="mt-sds-xl screen-495:mt-sds-xxl" variant="bodyXS">
        {t('collections:collectionPage.lastUpdated', {
          replace: {
            date: formatDate(collection.updated_date),
          },
        })}
      </Text>
    </div>
  );
}
