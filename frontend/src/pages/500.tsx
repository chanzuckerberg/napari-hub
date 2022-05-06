import { GetStaticPropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { ErrorMessage } from '@/components/ErrorMessage';
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

export default function ServerError() {
  const [t] = useTranslation(['common']);

  return (
    <div className="flex flex-grow items-center justify-center">
      <ErrorMessage>{t('common:errors.serverError')}</ErrorMessage>
    </div>
  );
}
