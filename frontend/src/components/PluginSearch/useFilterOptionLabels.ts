import { useTranslation } from 'next-i18next';

interface FilterOptionLabel {
  label: string;
  tooltip?: string;
}

export function useFilterOptionLabels() {
  const [t] = useTranslation(['homePage']);
  const filterOptionLabels: Record<string, FilterOptionLabel> = {
    // Operating System
    linux: t('homePage:filter.requirement.osLinux'),
    mac: t('homePage:filter.requirement.osMac'),
    windows: t('homePage:filter.requirement.osWindows'),

    // License
    openSource: t('homePage:filter.requirement.ossLicense'),

    reader: t('homePage:filter.requirement.reader'),
    sample_data: t('homePage:filter.requirement.sample_data'),
    theme: t('homePage:filter.requirement.theme'),
    widget: t('homePage:filter.requirement.widget'),
    writer: t('homePage:filter.requirement.writer'),
  };

  return filterOptionLabels;
}
