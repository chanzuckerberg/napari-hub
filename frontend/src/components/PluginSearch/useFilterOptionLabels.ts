import { useTranslation } from 'next-i18next';

export function useFilterOptionLabels() {
  const [t] = useTranslation(['homePage']);
  const filterOptionLabels: Record<string, string | undefined> = {
    // Operating System
    linux: t('homePage:filter.operatingSystem.linux'),
    mac: t('homePage:filter.operatingSystem.mac'),
    windows: t('homePage:filter.operatingSystem.windows'),

    // License
    openSource: t('homePage:filter.requirement.ossLicense'),
  };

  return filterOptionLabels;
}
