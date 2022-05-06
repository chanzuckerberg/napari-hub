import { GetStaticPropsContext } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { ErrorMessage } from '@/components/ErrorMessage';
import { I18n } from '@/components/I18n';
import { I18nNamespace } from '@/types/i18n';
import { createUrl } from '@/utils';

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
  const router = useRouter();
  const { pathname } = createUrl(router.asPath);

  return (
    <div className="flex flex-grow items-center justify-center">
      <ErrorMessage>
        <I18n i18nKey="common:errors.notFound" values={{ pathname }} />
      </ErrorMessage>
    </div>
  );
}
