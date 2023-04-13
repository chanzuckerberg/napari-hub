import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { useEffect } from 'react';

import { Link } from '@/components/Link';
import { Text } from '@/components/Text';
import { useLoadingState } from '@/context/loading';
import { I18nKeys } from '@/types/i18n';
import { SitemapCategory, SitemapEntry } from '@/types/sitemap';

import { SitemapEntryList } from './SitemapEntryList';
import { SitemapLoader } from './SitemapLoader';
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
  const isLoading = useLoadingState();

  // Scroll to top if loading sitemap page.
  useEffect(() => {
    if (isLoading) {
      window.scrollTo(0, 0);
    }
  }, [isLoading]);

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

      {Object.entries(categorizedEntries).map(
        ([currentCategory, currentEntries]) => {
          const category = currentCategory as SitemapCategory;

          return (
            <div
              className={clsx(
                'flex flex-col gap-2',
                'mt-sds-l screen-600:mt-sds-xxl',
                'screen-600:col-span-2 screen-875:col-span-3',
              )}
            >
              <Text variant="h2">
                <Link className="underline" href={CATEGORY_TO_PATH[category]}>
                  {t(`common:${category}` as I18nKeys<'common'>)}
                </Link>
              </Text>

              {isLoading ? (
                <SitemapLoader category={category} />
              ) : (
                <SitemapEntryList
                  category={category}
                  entries={currentEntries}
                />
              )}
            </div>
          );
        },
      )}
    </div>
  );
}
