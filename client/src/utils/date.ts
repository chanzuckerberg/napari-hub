const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Utility to transform a date into a more readable format.  Useful for ISO and
 * UTC date strings that need to be more readable.
 *
 * @param dateString A date string parseable by Date
 * @returns The formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  const dayValue = date.getDate();
  let day = String(dayValue);
  if (dayValue < 10) {
    day = `0${day}`;
  }

  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
