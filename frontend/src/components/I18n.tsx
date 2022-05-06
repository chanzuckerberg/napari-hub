import { Trans } from 'next-i18next';
import type { TFuncKey, TransProps } from 'react-i18next';

import { I18nKeys, I18nNamespace } from '@/types/i18n';

import { Link, Props as LinkProps } from './Link';

interface Props<N extends I18nNamespace>
  extends Omit<
    TransProps<TFuncKey<I18nNamespace>, I18nNamespace>,
    'ns' | 'i18nKey'
  > {
  i18nKey: I18nKeys<N>;
  linkProps?: Partial<LinkProps>;
  externalLinkProps?: Partial<LinkProps>;
}

/**
 * Wrapper over `Trans` component with strong typing support for i18n keys with
 * their associated namespaces. It also includes a few default components for
 * rendering inline JSX.
 */
export function I18n<N extends I18nNamespace>({
  i18nKey,
  components,
  linkProps,
  externalLinkProps,
  ...props
}: Props<N>) {
  // Split string into namespace and key.
  const parts = i18nKey.split(':');
  const namespace = parts[0] as I18nNamespace;
  const key = parts[1] as TFuncKey<I18nNamespace>;

  return (
    <Trans
      {...props}
      ns={namespace}
      i18nKey={key}
      // Components to use when replacing inline i18n JSX.
      components={{
        bold: <span className="font-bold" />,
        code: <span className="font-mono" />,

        hubLink: (
          <Link className="underline" {...linkProps}>
            tmp
          </Link>
        ),

        externalLink: (
          <Link className="underline" newTab {...externalLinkProps}>
            tmp
          </Link>
        ),

        ...components,
      }}
    />
  );
}
