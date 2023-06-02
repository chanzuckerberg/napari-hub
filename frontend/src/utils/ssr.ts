import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { SSRConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'querystring';

import { E2E } from '@/constants/env';
import {
  FEATURE_FLAG_LIST,
  FeatureFlagMap,
  featureFlagsStore,
  getEnabledFeatureFlags,
  getFeatureFlags,
} from '@/store/featureFlags';
import { I18nNamespace } from '@/types/i18n';

/**
 * Common locales that are included on every page
 */
const DEFAULT_LOCALES = ['common', 'footer', 'pageTitles'] as const;

interface GetServerSidePropsHandlerOptions<
  P,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> {
  /**
   * List of i18n locales to include in the current page.
   */
  locales?: Exclude<I18nNamespace, typeof DEFAULT_LOCALES[number]>[];

  /**
   * Function for getting additional props to pass to the page.
   */
  getProps?(
    context: GetServerSidePropsContext<Q>,
    featureFlags: FeatureFlagMap,
  ): Promise<GetServerSidePropsResult<P>>;
}

type PropsResult<P> = { props: P | Promise<P> };

function isPropsResult<P>(
  result?: GetServerSidePropsResult<P>,
): result is PropsResult<P> {
  return !!(result as PropsResult<P>).props;
}

type ServerSidePropsHandlerProps<P> = P &
  Partial<SSRConfig> & {
    featureFlags?: FeatureFlagMap;
  };

/**
 * Wrapper over `getServerSideProps()` that includes data required for every SSR page.
 */
export function getServerSidePropsHandler<
  P,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
>({
  locales = [],
  getProps,
}: GetServerSidePropsHandlerOptions<P, Q>): GetServerSideProps<
  ServerSidePropsHandlerProps<P>,
  Q
> {
  return async (context) => {
    const { locale, req } = context;
    const translationProps = await serverSideTranslations(locale ?? 'en', [
      'common',
      'footer',
      'pageTitles',
      ...locales,
    ] as I18nNamespace[]);

    const featureFlags = E2E
      ? getEnabledFeatureFlags(
          // TODO update E2E tests to test for sort dropdown
          ...FEATURE_FLAG_LIST.filter((flag) => flag !== 'homePageRedesign'),
        )
      : await getFeatureFlags(req.url ?? '/');

    // Assign to feature flag store so that server code can use the state.
    Object.assign(featureFlagsStore, featureFlags);

    const extraProps = await getProps?.(context, featureFlags);

    return {
      ...extraProps,

      props: {
        ...(isPropsResult(extraProps) ? extraProps.props : undefined),
        ...translationProps,
        featureFlags,
      } as ServerSidePropsHandlerProps<P>,
    };
  };
}
