/**
 * This module contains typing information for accessing i18n resources. This is
 * what allows us to provide static typing and autocomplete for i18n keys.
 *
 * This works by using type imports to import the type of the i18n JSON files
 * since TypeScript has support for importing JSON with full type information.
 * This allows us to pass the information to `react-i18next` so that the i18n
 * keys can be generated "dynamically" using type inference.
 *
 * When adding a new namespace file, you'll need to do the following things:
 *
 * 1. Create a new namespace JSON file in the English locale directory.
 * 2. Import the JSON file type.
 * 3. Add the JSON file type to the `I18nResourceMap` interface with the key
 *    matching the base filename.
 * 4. Add the namespace to the namespace array used by the
 *    `serverSideTranslations()` function for each page that uses the locale.
 */

import type { TFuncKey } from 'react-i18next';

import type Common from '@/i18n/en/common.json';
import type Footer from '@/i18n/en/footer.json';
import type HomePage from '@/i18n/en/homePage.json';
import type PageTitles from '@/i18n/en/pageTitles.json';
import type PluginData from '@/i18n/en/pluginData.json';
import type PluginPage from '@/i18n/en/pluginPage.json';
import type Preview from '@/i18n/en/preview.json';

/**
 * Interface for all i18n resources. This is used for generating type
 * information for `react-i18next`. The key is an i18n namespace and should
 * match the name of the base filename.
 */
interface I18nResourceMap {
  common: typeof Common;
  footer: typeof Footer;
  homePage: typeof HomePage;
  pluginData: typeof PluginData;
  pageTitles: typeof PageTitles;
  pluginPage: typeof PluginPage;
  preview: typeof Preview;
}

/**
 * Ambient module declaration responsible for passing the `I18nResourceMap` type
 * to `react-i18next` to generate type information for i18n keys.
 * https://react.i18next.com/latest/typescript
 */
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'en';
    resources: I18nResourceMap;
  }
}

/**
 * Type for all i18n namespace string keys.
 */
export type I18nNamespace = keyof I18nResourceMap;

/**
 * Type for plugin metadata labels.
 */
export type I18nPluginDataLabel =
  | string
  | {
      /**
       * Label used for most contexts.
       */
      label: string;

      /**
       * Label used for preview page.
       */
      preview?: string;

      /**
       * Shorter version of the regular label.
       */
      short?: string;

      /**
       * All lowercase version of the label.
       */
      lower?: string;
    };

/**
 * Helper type for getting a union of all i18n keys for a specific namespace.
 */
export type I18nKeys<N extends I18nNamespace> = N extends I18nNamespace
  ? `${N}:${TFuncKey<N>}`
  : never;
