import { ReactNode } from 'react';

/**
 * Helper type utility for describing a type that is either a singular or
 * array-like value.
 */
type ArrayOrSingleValue<T> = T | T[];

/**
 * Interface for metadata items that are links.
 */
export interface MetadataItemLink {
  href: string;
  icon: ReactNode;
  missingIcon?: ReactNode;
  text: string;
}

/**
 * Possible metadata values.
 */
export type MetadataValueTypes = string | MetadataItemLink;

/**
 * Metadata values can be either a single value or an array.
 */
export type MetadataValue = ArrayOrSingleValue<MetadataValueTypes>;

/**
 * Metadata item to render in the MetadataList component.
 */
export interface MetadataItem {
  title: string;
  value: MetadataValue;
}
