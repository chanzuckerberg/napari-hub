import { useRouter } from 'next/router';

import { PREVIEW, PROD, STAGING } from '@/constants/env';

import { createUrl } from './url';

export type FeatureFlagEnvironment = 'dev' | 'staging' | 'prod' | 'preview';

export interface FeatureFlag {
  environments: FeatureFlagEnvironment[];
}

/**
 * Helper to preserve the keys in the type while forcing each value to be of
 * type `FeatureFlag`.
 */
function createFeatureFlags<T>(flags: { [key in keyof T]: FeatureFlag }) {
  return flags;
}

export const FEATURE_FLAGS = createFeatureFlags({
  categoryFilters: {
    environments: ['dev', 'staging', 'prod', 'preview'],
  },

  npe2: {
    environments: ['dev'],
  },
});

/**
 * Type storing all available feature flag keys.
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

const ENABLE_FEATURE_FLAG_QUERY_PARAM = 'enable-feature';
const DISABLE_FEATURE_FLAG_QUERY_PARAM = 'disable-feature';

/**
 * Helper that checks if a feature flag is enabled using the feature flag key. A
 * flag can be enabled in two ways:
 *
 * - Local storage
 * - Environment
 *
 * Local storage will always override whatever is in the environment.
 *
 * @param key The feature flag key.
 * @returns True or false depending on if the feature flag is enabled.
 */
export function useIsFeatureFlagEnabled(key: FeatureFlagKey): boolean {
  const router = useRouter();
  const flag = FEATURE_FLAGS[key];

  // If the flag is enabled / disabled in a URL parameter, then override the
  // environment check.
  const params = createUrl(router.asPath).searchParams;

  const enabledFeatures = new Set(
    params.getAll(ENABLE_FEATURE_FLAG_QUERY_PARAM),
  );
  const disabledFetures = new Set(
    params.getAll(DISABLE_FEATURE_FLAG_QUERY_PARAM),
  );

  if (enabledFeatures.has(key)) {
    return true;
  }

  if (disabledFetures.has(key)) {
    return false;
  }

  if (PROD) {
    return flag.environments.includes('prod');
  }

  if (STAGING) {
    return flag.environments.includes('staging');
  }

  if (PREVIEW) {
    return flag.environments.includes('preview');
  }

  return flag.environments.includes('dev');
}
