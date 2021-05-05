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
