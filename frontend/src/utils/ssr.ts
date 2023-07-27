import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next';
import { SSRConfig } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ParsedUrlQuery } from 'querystring';

import { E2E } from '@/constants/env';
import { I18nResources } from '@/constants/i18n';
import {
  FEATURE_FLAG_LIST,
  FeatureFlagMap,
  featureFlagsStore,
  getEnabledFeatureFlags,
  getFeatureFlags,
} from '@/store/featureFlags';

import { TTLCache } from './ttl-cache';

/**
 * Common locales that are included on every page
 */
interface GetServerSidePropsHandlerOptions<
  P,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> {
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

// Expire feature flags after 5 minutes
const FLAG_CACHE_TTL = 1000 * 60 * 5;
const FLAG_CACHE = new TTLCache<FeatureFlagMap>(FLAG_CACHE_TTL);
const FLAG_CACHE_KEY = 'featureFlags';

/**
 * Wrapper over `getServerSideProps()` that includes data required for every SSR page.
 */
export function getServerSidePropsHandler<
  P,
  Q extends ParsedUrlQuery = ParsedUrlQuery,
>({
  getProps,
}: GetServerSidePropsHandlerOptions<P, Q>): GetServerSideProps<
  ServerSidePropsHandlerProps<P>,
  Q
> {
  return async (context) => {
    const { locale, req } = context;
    const translationProps = await serverSideTranslations(
      locale ?? 'en',
      Object.keys(I18nResources),
    );

    const featureFlags = E2E
      ? getEnabledFeatureFlags(...FEATURE_FLAG_LIST)
      : await FLAG_CACHE.get(FLAG_CACHE_KEY, () =>
          getFeatureFlags(req.url ?? '/'),
        );

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
