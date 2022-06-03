import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { Link } from 'src/components/Link';

import { formatDate } from '@/utils';

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

      <p
        className={clsx(
          'mt-6 screen-495:mt-[35px]',
          'text-[11px] screen-495:text-[17px]',
          'leading-[175%] screen-495:leading-[150%]',
        )}
      >
        {collection.description}
      </p>

      <p
        className={clsx(
          'space-x-1',
          'mt-5 screen-495:mt-6',
          'text-[11px] screen-495:text-[14px]',
          'leading-[150%] screen-495:leading-[118%]',
        )}
      >
        <strong>{curator.name}</strong>
        <span>{curator.title},</span>

        {affiliation.website ? (
          <span>{affiliation.institution}</span>
        ) : (
          <Link className="underline" href={affiliation.website} newTab>
            {affiliation.institution}
          </Link>
        )}
      </p>

      <p
        className={clsx(
          'mt-6 screen-495:mt-[35px]',
          'text-[9px] screen-495:text-[14px]',
          'leading-[150%] screen-495:leading-[200%]',
        )}
      >
        {t('collections:collectionPage.lastUpdated', {
          replace: {
            date: formatDate(collection.updated_date.toString()),
          },
        })}
      </p>
    </div>
  );
}
