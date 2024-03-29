import { useTranslation } from 'next-i18next';
import { Tooltip } from 'src/components/Tooltip';

import { Link } from '@/components/Link';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { usePluginState } from '@/context/plugin';

export function PluginPyPiLink() {
  const [t] = useTranslation(['pluginPage']);
  const { plugin } = usePluginState();

  if (!plugin?.name) {
    return null;
  }

  return (
    <SkeletonLoader className="h-[20px] w-[40px] mt-sds-m">
      <Tooltip
        title={t('pluginPage:tooltips.viewPypiPackage')}
        placement="right"
        disableInteractive
        leaveDelay={0}
      >
        <Link
          className="mt-sds-m screen-495:mt-sds-l text-[0.6875rem] underline"
          href={`https://pypi.org/project/${plugin.name}`}
        >
          {plugin?.name}
        </Link>
      </Tooltip>
    </SkeletonLoader>
  );
}
