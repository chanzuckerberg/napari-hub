import { SitemapEntry } from '@/types/sitemap';

const NAPARI_PLUGIN_NAME_PREFIX = 'napari-';
const NAPARI_PLUGIN_DISPLAY_PREFIX = 'napari ';

/**
 * Gets the first letter from an sitemap plugin entry's display name (if
 * available) or URL. If the plugin is prefixed by `napari`, then the first
 * letter will be from the part that follows `napari`.
 */
export function getPluginFirstLetter(entry: SitemapEntry) {
  const name = (entry.name ?? entry.url.split('/').at(-1) ?? '').toLowerCase();

  if (name.startsWith(NAPARI_PLUGIN_DISPLAY_PREFIX)) {
    return name[NAPARI_PLUGIN_DISPLAY_PREFIX.length].toUpperCase();
  }

  if (name.startsWith(NAPARI_PLUGIN_NAME_PREFIX)) {
    return name[NAPARI_PLUGIN_NAME_PREFIX.length].toUpperCase();
  }

  return name[0].toUpperCase();
}
