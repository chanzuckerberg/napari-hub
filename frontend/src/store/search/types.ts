import { SearchResult } from './search.types';

/**
 * Function that transforms a list of search results into a different list of
 * search results after sorting or filtering.
 */
export type SearchResultTransformFunction = (
  results: SearchResult[],
) => SearchResult[];

/**
 * Response data from fetching the SPDX license list:
 * https://github.com/spdx/license-list-data/blob/master/json/licenses.json
 */
export interface SpdxLicenseResponse {
  licenseListVersion: string;
  licenses: SpdxLicenseData[];
  releaseDate: string;
}

/**
 * Response data for an SPDX license object.
 */
export interface SpdxLicenseData {
  reference: string;
  isDeprecatedLicenseId: boolean;
  detailsUrl: string;
  referenceNumber: number;
  name: string;
  licenseId: string;
  seeAlso: string[];
  isOsiApproved: boolean;
  isFsfLibre?: boolean;
}

export interface Resettable {
  reset(): void;
}
