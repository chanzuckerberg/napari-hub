import clsx from 'clsx';

import { useFeatureFlagConfig } from '@/store/featureFlags';

import { Markdown } from './Markdown';

interface BannerConfig {
  message?: string;
}

export function Banner() {
  const banner = useFeatureFlagConfig<BannerConfig>('banner');

  if (!banner?.message) {
    return <></>;
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center w-full p-4',
        'bg-hub-primary-200 text-center',
      )}
    >
      <Markdown>{banner?.message}</Markdown>
    </div>
  );
}
