import { useTranslation } from 'next-i18next';
import { Tooltip } from 'src/components/Tooltip';

import { Link } from '@/components/Link';
import { usePluginState } from '@/context/plugin';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

export function PluginPyPiLink() {
  const [t] = useTranslation(['pluginPage']);
  const { plugin } = usePluginState();
  const isNpe2Enabled = useIsFeatureFlagEnabled('npe2');

  if (!isNpe2Enabled || !plugin?.name) {
    return <></>;
  }

  return (
    <Tooltip
      title={t('pluginPage:tooltips.viewPypiPackage')}
      placement="right"
      disableInteractive
      leaveDelay={0}
    >
      <Link
        className="mt-sds-m screen-495:mt-sds-l text-[0.6875rem] underline"
        href={`https://pypi.org/project/${plugin?.name}`}
      >
        {plugin?.name}
      </Link>
    </Tooltip>
  );
}
