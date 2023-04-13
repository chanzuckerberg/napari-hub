import { useTranslation } from 'next-i18next';

import { I18nKeys } from '@/types/i18n';
import { SitemapEntry } from '@/types/sitemap';
import { createUrl } from '@/utils';

/**
 * Mapping of URLs to a display name to render on the sitemap page. Links in the
 * `Home` category do not have a display name associated with it like plugin /
 * categories, so we need to map the URL to a display name.
 */
const PATH_TO_I18N_KEY: Record<string, I18nKeys<'common'> | undefined> = {
  '/': 'common:home',
  '/collections': 'common:collections',
  '/about': 'common:about',
  '/faq': 'common:faq',
  '/contact': 'common:contact',
  '/privacy': 'common:privacy',
};

export function useLabelForSitemapEntry(entry: SitemapEntry): string {
  const [t] = useTranslation(['common']);

  let label = entry.name;

  if (!label) {
    const i18nKey = PATH_TO_I18N_KEY[createUrl(entry.url).pathname];
    if (i18nKey) {
      label = t(i18nKey) as string;
    }
  }

  if (!label) {
    label = entry.url;
  }

  return label;
}
