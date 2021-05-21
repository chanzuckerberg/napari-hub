import dayjs from 'dayjs';

/**
 * Utility to transform a date into a more readable format.  Useful for ISO and
 * UTC date strings that need to be more readable.
 *
 * @param dateString A date string parseable by Date
 * @returns The formatted date string
 */
export function formatDate(dateString: string): string {
  return dayjs(dateString).format('DD MMMM YYYY');
}

/**
 * Utility for formatting a pypi operating systems string. This removes the
 * nested classifiers so that only the OS name is rendered.
 *
 * @param operatingSystem List of operating systems classifiers.
 * @returns The operating system formatted as a comma list.
 */
export function formatOperatingSystem(operatingSystem: string): string {
  // Return last part of OS trove classifier. The nesting on pypi is
  // arbitrary, so you can have a long string like "Operating Systems ::
  // Microsoft :: Windows :: Windows 10", or a short string like "Operating
  // Systems :: OS Independent".
  const parts = operatingSystem.split(' :: ');
  const name = parts[parts.length - 1];

  return name.replace('OS Independent', 'All');
}
