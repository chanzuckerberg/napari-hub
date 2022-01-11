import { useTranslation } from 'next-i18next';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  error?: string;
}

/**
 * Component for rendering basic error message.
 *
 * TODO Show better error page when designs are available
 */
export function ErrorMessage({ children, error }: Props) {
  const [t] = useTranslation(['common']);

  return (
    <div className="flex flex-auto flex-col items-center justify-center mt-6 md:mt-12">
      <h1 className="text-4xl">
        {t('common:error')}: {children}
      </h1>

      {error && <pre className="mt-6 md:mt-12">{error}</pre>}
    </div>
  );
}
