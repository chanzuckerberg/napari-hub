import common from '@/i18n/en/common.json';
import footer from '@/i18n/en/footer.json';
import homePage from '@/i18n/en/homePage.json';
import pageTitles from '@/i18n/en/pageTitles.json';
import pluginData from '@/i18n/en/pluginData.json';
import pluginPage from '@/i18n/en/pluginPage.json';
import preview from '@/i18n/en/preview.json';

/**
 * Dictionary of all i18n resources. This is used for generating type
 * information and providing mock i18n data for unit testing.
 */
export const I18nResources = {
  common,
  footer,
  homePage,
  pageTitles,
  pluginData,
  pluginPage,
  preview,
};

/**
 * Type for all i18n resources. This is used for generating type
 * information for `react-i18next`. The key is an i18n namespace and should
 * match the name of the base filename.
 */
export type I18nResourceMap = typeof I18nResources;

/**
 * Type for all i18n namespace string keys.
 */
export type I18nNamespace = keyof typeof I18nResources;
