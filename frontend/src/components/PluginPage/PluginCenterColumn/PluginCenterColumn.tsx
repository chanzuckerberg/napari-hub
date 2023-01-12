import clsx from 'clsx';
import { useRef } from 'react';

import { PluginPageContent } from '@/components/PluginPage/PluginPageContent';
import { PluginTabs } from '@/components/PluginPage/PluginTabs';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

import { PluginActions } from './PluginActions';
import { PluginPyPiLink } from './PluginPyPiLink';
import { PluginSummary } from './PluginSummary';
import { PluginTitle } from './PluginTitle';

export function PluginCenterColumn() {
  const containerRef = useRef<HTMLElement>(null);
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');
  const isActivityDashboardEnabled =
    useIsFeatureFlagEnabled('activityDashboard');

  usePreviewClickAway(isNpe2Enabled ? 'metadata-displayName' : 'metadata-name');
  usePreviewClickAway('metadata-summary');
  usePreviewClickAway('metadata-description');

  return (
    <article
      className={clsx(
        'w-full col-span-2 row-start-1',
        'screen-875:col-span-3',
        'screen-1150:col-start-1',
        'screen-1425:col-start-2',
      )}
      ref={containerRef}
    >
      <PluginTitle />
      <PluginPyPiLink />
      <PluginSummary />
      <PluginActions />

      {isActivityDashboardEnabled ? (
        <PluginTabs containerRef={containerRef} />
      ) : (
        <PluginPageContent />
      )}
    </article>
  );
}
