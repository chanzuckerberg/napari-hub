import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

const DEFAULT_OPTIONS: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

export function useNumberFormatter(options = DEFAULT_OPTIONS) {
  const { i18n } = useTranslation();

  return useMemo(
    () => new Intl.NumberFormat(i18n.language, options),
    [i18n.language, options],
  );
}

export function useFormattedNumber(
  value: number | null | undefined,
  options = DEFAULT_OPTIONS,
): string {
  const formatter = useNumberFormatter(options);

  return useMemo(
    () => (typeof value === 'number' ? formatter.format(value) : String(value)),
    [formatter, value],
  );
}
