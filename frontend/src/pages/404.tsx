import { GetStaticPropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { NotFoundPage } from '@/components/NotFoundPage';
import { I18nNamespace } from '@/types/i18n';

export async function getStaticProps({ locale = 'en' }: GetStaticPropsContext) {
  const props = await serverSideTranslations(locale, [
    'common',
    'footer',

    // Home and plugin page namespaces required for page transitions.
    'pluginPage',
    'homePage',
  ] as I18nNamespace[]);

  return { props };
}

export default function NotFound() {
  return <NotFoundPage />;
}
