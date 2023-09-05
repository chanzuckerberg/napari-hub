import clsx from 'clsx';
import { useRef } from 'react';

import { PluginTabs } from '@/components/PluginPage/PluginTabs';
import { usePreviewClickAway } from '@/hooks/usePreviewClickAway';

import { PluginActions } from './PluginActions';
import { PluginAuthors } from './PluginAuthors';
import { PluginPyPiLink } from './PluginPyPiLink';
import { PluginSummary } from './PluginSummary';
import { PluginTitle } from './PluginTitle';
import { PluginViewProjectDataLink } from './PluginViewProjectDataLink';

export function PluginCenterColumn() {
  const containerRef = useRef<HTMLElement>(null);

  usePreviewClickAway('metadata-displayName');
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
      <PluginAuthors />
      <PluginActions />
      <PluginViewProjectDataLink />

      <PluginTabs containerRef={containerRef} />
    </article>
  );
}
