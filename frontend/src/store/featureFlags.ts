import { SplitFactory } from '@splitsoftware/splitio';
import { cloneDeep, set } from 'lodash';
import { useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { proxy, useSnapshot } from 'valtio';

import { createUrl } from '@/utils';

export type FeatureFlagValue = 'on' | 'off';

export interface FeatureFlag<
  C = Record<string, unknown>,
  V = FeatureFlagValue,
> {
  key: string;
  value: V;
  config?: C | null;
}

export const FEATURE_FLAG_LIST = [
  'activityDashboard',
  'activityDashboardMaintenance',
  'banner',
  'categoryFilters',
  'collections',
  'npe2',
  's3ToDynamoMigration',
  'homePageRedesign',
] as const;

export type FeatureFlagKey = typeof FEATURE_FLAG_LIST[number];
export type FeatureFlagMap = Record<FeatureFlagKey, FeatureFlag>;

export const FEATURE_FLAGS = FEATURE_FLAG_LIST.reduce(
  (result, key) =>
    set(result, key, {
      key,
      value: 'off',
    }),
  {} as FeatureFlagMap,
);

/**
 * Feature flags to enable in preview environment.
 *
 * TODO Move this to split.io. The issue is since preview pages are built on the
 * user's GitHub workflow, they won't have access to the split.io API keys when
 * building the preview page. This will be possible once we move preview pages
 * server side.
 */
export const PREVIEW_ENABLED_FEATURES: FeatureFlagKey[] = [
  'activityDashboard',
  'categoryFilters',
  'collections',
  'npe2',
];

/**
 * Get feature flag map with specified flag keys enabled
 */
export function getEnabledFeatureFlags(...enabledList: FeatureFlagKey[]) {
  const flags = cloneDeep(FEATURE_FLAGS);

  for (const flag of enabledList) {
    flags[flag].value = 'on';
  }

  return flags;
}

/**
 * Store used for holding feature flag data.
 */
export const featureFlagsStore = proxy({ ...FEATURE_FLAGS });

const ENABLE_FEATURE_FLAG_QUERY_PARAM = 'enable-feature';
const DISABLE_FEATURE_FLAG_QUERY_PARAM = 'disable-feature';

/**
 * Helper function for overriding a feature flag if a query parameter is
 * provided for that feature flag key.
 */
function getFeatureFlagForURL(flag: FeatureFlag, url: string): FeatureFlag {
  // If the flag is enabled / disabled in a URL parameter, then override the
  // environment check.
  const params = createUrl(url).searchParams;

  const enabledFeatures = new Set(
    params.getAll(ENABLE_FEATURE_FLAG_QUERY_PARAM),
  );
  const disabledFeatures = new Set(
    params.getAll(DISABLE_FEATURE_FLAG_QUERY_PARAM),
  );

  const isEnabled = enabledFeatures.has(flag.key);
  const isDisabled = disabledFeatures.has(flag.key);

  if (isEnabled || isDisabled) {
    return {
      ...flag,
      value: isEnabled ? 'on' : 'off',
    };
  }

  return flag;
}

/**
 * Utility function for fetching feature flags from Split.io. A URL must be
 * provided to this function to also check if there are any feature flag query
 * parameters to override whatever is set on Split.io for testing purposes.
 */
export async function getFeatureFlags(url: string): Promise<FeatureFlagMap> {
  const { SPLIT_IO_SERVER_KEY } = process.env;

  if (!SPLIT_IO_SERVER_KEY) {
    throw new Error('SPLIT_IO_SERVER_KEY env not defined');
  }

  const client = SplitFactory({
    core: {
      authorizationKey: SPLIT_IO_SERVER_KEY,
    },
  }).client();

  // Wait for client to initialize
  await new Promise((resolve) => {
    client.on(client.Event.SDK_READY, resolve);
  });

  const keys = Object.keys(FEATURE_FLAGS);
  const treatments = client.getTreatmentsWithConfig(uuid(), keys);

  const featureFlags = { ...FEATURE_FLAGS };
  for (const [key, result] of Object.entries(treatments)) {
    const config = (result.config ? JSON.parse(result.config) : undefined) as
      | Record<string, unknown>
      | undefined;

    const flag: FeatureFlag = {
      key,
      value: result.treatment as FeatureFlagValue,
      ...(config ? { config } : {}),
    };

    featureFlags[key as FeatureFlagKey] = getFeatureFlagForURL(flag, url);
  }

  await client.destroy();

  return featureFlags;
}

/**
 * Initializes the feature flag state on initial load.
 */
export function useInitFeatureFlags(featureFlags?: FeatureFlagMap) {
  const initialLoadRef = useRef(true);

  if (initialLoadRef.current && featureFlags) {
    initialLoadRef.current = false;
    Object.assign(featureFlagsStore, featureFlags);
  }
}

/**
 * Hook to check if a feature flag is enabled.
 */
export function useIsFeatureFlagEnabled(key: FeatureFlagKey): boolean {
  const flags = useSnapshot(featureFlagsStore);
  return flags[key].value === 'on';
}

/**
 * Hook to check if a feature flag is enabled.
 */
export function useFeatureFlagConfig<T = Record<string, unknown>>(
  key: FeatureFlagKey,
): T | undefined {
  const flags = useSnapshot(featureFlagsStore);
  return flags[key].config as T | undefined;
}
