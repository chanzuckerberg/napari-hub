import { useLinks } from '@/hooks/useLinks';
import { useIsFeatureFlagEnabled } from '@/store/featureFlags';

export function useAppBarLinks() {
  const links = useLinks();
  const isCollectionsEnabled = useIsFeatureFlagEnabled('collections');

  if (isCollectionsEnabled) {
    return [links.PLUGINS, links.COLLECTIONS];
  }

  return [links.ABOUT, links.FAQ];
}
