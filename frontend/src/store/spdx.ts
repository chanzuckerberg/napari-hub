import { atom } from 'jotai';

export interface SpdxLicenseResponse {
  licenseListVersion: string;
  licenses: SpdxLicenseData[];
  releaseDate: string;
}

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

/**
 * State for OSI approved licenses.
 */
export const osiApprovedLicenseSetState = atom(new Set<string>());

/**
 * Returns a set of SPDX license IDs that are OSI approved. This is useful for
 * initialization of the above state.
 *
 * @param licenses A list of SPDX license data.
 * @returns The set of OSI approved licenses
 */
export function getOsiApprovedLicenseSet(
  licenses: SpdxLicenseData[],
): Set<string> {
  return new Set(
    licenses
      .filter((license) => license.isOsiApproved)
      .map((license) => license.licenseId),
  );
}
