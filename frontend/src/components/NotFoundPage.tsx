import { useRouter } from 'next/router';

import { createUrl } from '@/utils';

import { ErrorMessage } from './ErrorMessage';
import { I18n } from './I18n';

export function NotFoundPage() {
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
