import clsx from 'clsx';
import { Button } from 'czifui';
import { useTranslation } from 'react-i18next';

import { I18n } from '@/components/I18n';
import { usePlausible } from '@/hooks';
import { I18nKeys } from '@/types/i18n';

import { CollectionCard } from './CollectionCard';
import { useCollections } from './context';

/**
 * Renders the collection home page intro and intro bullet list.
 */
function Intro() {
  const { t } = useTranslation(['collections']);

  const items: I18nKeys<'collections'>[] = [
    'collections:collectionsPage.protocols',
    'collections:collectionsPage.toolkits',
    'collections:collectionsPage.assortments',
  ];

  return (
    <div
      className={clsx(
        'pt-[14px] screen-495:pt-[40px]',
        'col-span-2 screen-875:col-span-3',
        'screen-1425:row-start-2 screen-1425:col-start-2',
        'text-[11px] screen-495:text-[17px]',
      )}
    >
      <p>{t('collections:collectionsPage.intro')}</p>

      <ul className="list-disc ml-4 mt-[1.0625rem] leading-[175%]">
        {items.map((item) => (
          <li key={item}>
            <I18n
              i18nKey={item}
              components={{ bold: <strong className="font-semibold" /> }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Button for creating a collection. Right now it links to the collection repo,
 * but may have its functionality changed in the future.
 * TODO Add analytics for this button
 */
function CreateCollectionButton() {
  const { t } = useTranslation(['collections']);
  const plausible = usePlausible();

  return (
    <Button
      className={clsx(
        'mt-[17px] screen-495:mt-[35px]',
        'bg-napari-primary hover:bg-napari-hover',
        'font-semibold text-center',
        'w-full h-[35px] screen-495:h-12',
        'col-span-2 screen-495:col-span-1',
        'screen-875:row-start-3 screen-1425:row-start-3',
        'text-[11px] screen-495:text-[14px]',
        'screen-1425:col-start-2',
      )}
      href="https://github.com/chanzuckerberg/napari-hub-collections"
      onClick={() => plausible('Create a new collection')}
      target="_blank"
      rel="noreferrer"
    >
      {t('collections:collectionsPage.createCollection')}
    </Button>
  );
}

/**
 * List of collection cards that will render as a list on mobile, then switch to
 * 2 and 3 column layouts when there's enough screen size.
 */
function CollectionGridList() {
  const collections = useCollections();

  return (
    <div
      className={clsx(
        'mt-6 screen-495:mt-12',
        'col-span-2 screen-875:col-span-3',
        'grid grid-cols-1 screen-600:grid-cols-2 screen-875:grid-cols-3',
        'screen-1425:col-start-2',
        'screen-875:row-start-4',
        'gap-6 screen-495:gap-12',
      )}
    >
      {collections.map((collection, index) => (
        <CollectionCard
          key={collection.title + collection.summary + String(index)}
          collection={collection}
        />
      ))}
    </div>
  );
}

/**
 * Home page for showing all collections.
 */
export function CollectionsPage() {
  const { t } = useTranslation(['collections']);

  return (
    <div
      className={clsx(
        'pt-[14px] screen-495:pt-[40px]',
        'pb-[75px] px-6 screen-495:px-12',
        'grid grid-cols-2 screen-875:grid-cols-napari-3 screen-1425:grid-cols-napari-5',
        'justify-center',
        'gap-x-6 screen-495:gap-x-12',
      )}
    >
      <h1
        className={clsx(
          'font-bold',
          'text-[1.4375rem] screen-495:text-[2.1875rem]',
          'col-span-2 screen-1425:col-start-2',
        )}
      >
        {t('collections:collectionsPage.title')}
      </h1>

      <Intro />
      <CreateCollectionButton />
      <CollectionGridList />
    </div>
  );
}
