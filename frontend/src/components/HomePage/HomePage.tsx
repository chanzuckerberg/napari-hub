import { useTranslation } from 'next-i18next';

import { Link } from '@/components/Link';
import { SearchBar } from '@/components/SearchBar';
import { SearchSection } from '@/components/SearchSection';
import { useOpenSearchPage } from '@/hooks/useOpenSearchPage';

import { FeaturedPlugins } from './FeaturedPlugins';
import { HomePageLayout } from './HomePageLayout';

export function HomePage() {
  const { t } = useTranslation(['homePage']);
  const openSearchPage = useOpenSearchPage();

  return (
    <HomePageLayout>
      <SearchSection
        title={t('homePage:discoverPlugins')}
        subtitle={
          <Link className="underline" href="/plugins">
            {t('homePage:browseAll')}
          </Link>
        }
        searchBar={
          <SearchBar
            inputProps={{ placeholder: t('homePage:searchBar') }}
            onSubmit={(query) => openSearchPage(query)}
            changeOnSubmit
          />
        }
      />
      <FeaturedPlugins />
    </HomePageLayout>
  );
}
