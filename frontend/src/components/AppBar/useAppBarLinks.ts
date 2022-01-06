import { useLinks } from '@/hooks/useLinks';

export function useAppBarLinks() {
  const links = useLinks();

  return [links.ABOUT, links.FAQ];
}
