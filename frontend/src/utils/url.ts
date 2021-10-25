/**
 * Checks if the string is an external URL. This works by using the value to
 * create a URL object. URL objects will throw errors for relative URLs if a
 * base URL isn't provided, so an error will indicate that the URL is an absolute URL.
 *
 * @param url The string to check.
 * @returns True if the string is an external URL, false if relative.
 */
export function isExternalUrl(url: string): boolean {
  try {
    return !!new URL(url);
  } catch (_) {
    return false;
  }
}

/**
 * Wrapper over the URL constructor with additional functionality. URLs that
 * cannot be constructor without a base will automatically have the base
 * `http://tmp.com` added to the URL. This is to ensure URLs can be created from
 * paths and full URLs, and for use cases where operating on the URL pathname
 * matter more than the actual host.
 *
 * @param urlOrPath URL or path string.
 * @param baseUrl URL to use for final URL.
 * @returns The combined URL object.
 */
export function createUrl(urlOrPath: string, baseUrl?: string): URL {
  let base = baseUrl;

  if (!base && !isExternalUrl(urlOrPath)) {
    base = 'http://tmp.com';
  }

  return new URL(urlOrPath, base);
}
