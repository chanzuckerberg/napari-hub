import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

export enum FormatType {
  Short,
  Standard,
}

const FORMAT_OPTIONS: Record<FormatType, Intl.NumberFormatOptions> = {
  [FormatType.Short]: {
    notation: 'compact',
    maximumFractionDigits: 1,
  },

  [FormatType.Standard]: {
    notation: 'standard',
  },
};

/**
 * Gets a number formatter instance that formats the number based on the
 * selected format type.
 */
export function useNumberFormatter(type = FormatType.Standard) {
  const { i18n } = useTranslation();

  return useMemo(
    () => new Intl.NumberFormat(i18n.language, FORMAT_OPTIONS[type]),
    [i18n.language, type],
  );
}

/**
 * Convenience hook for formatting and memoizing a number directly using the
 * above number formatter hook.
 */
export function useFormattedNumber(
  value: number | null | undefined,
  type = FormatType.Standard,
): string {
  const formatter = useNumberFormatter(type);

  return useMemo(
    () => (typeof value === 'number' ? formatter.format(value) : String(value)),
    [formatter, value],
  );
}
