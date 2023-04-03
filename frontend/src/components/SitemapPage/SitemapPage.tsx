import clsx from 'clsx';
import { useTranslation } from 'next-i18next';

import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
import { I18nKeys } from '@/types/i18n';
import { SitemapCategory, SitemapEntry } from '@/types/sitemap';

import { SitemapEntryList } from './SitemapEntryList';
import { useCategorizedSitemapEntries } from './useCategorizedSitemapEntries';

/**
 * Mapping of categories to links so that clicking on the category title will
 * bring users to their associated page.
 */
const CATEGORY_TO_PATH: Record<SitemapCategory, string> = {
  [SitemapCategory.Home]: '/',
  [SitemapCategory.Plugin]: '/',
  [SitemapCategory.Collection]: '/collections',
};

export function SitemapPage({ entries }: { entries: SitemapEntry[] }) {
  const [t] = useTranslation(['common']);
  const categorizedEntries = useCategorizedSitemapEntries(entries);

  return (
    <div
      className={clsx(
        'justify-center',
        'px-6 screen-600:px-12',
        'py-sds-l screen-600:py-sds-xxl',
        'grid screen-600:grid-cols-napari-2 screen-600:gap-x-12',
        'screen-875:grid-cols-napari-3',
      )}
    >
      <Text
        className="screen-600:col-span-2 screen-875:col-span-3"
        variant="h1"
      >
        {t('common:sitemap')}
      </Text>

      {Object.entries(categorizedEntries).map(([category, currentEntries]) => (
        <div
          className={clsx(
            'flex flex-col gap-2',
            'mt-sds-l screen-600:mt-sds-xxl',
            'screen-600:col-span-2 screen-875:col-span-3',
          )}
        >
          <Text variant="h2">
            <Link
              className="underline"
              href={CATEGORY_TO_PATH[category as SitemapCategory]}
            >
              {t(`common:${category}` as I18nKeys<'common'>)}
            </Link>
          </Text>

          <SitemapEntryList
            category={category as SitemapCategory}
            entries={currentEntries}
          />
        </div>
      ))}
    </div>
  );
}
