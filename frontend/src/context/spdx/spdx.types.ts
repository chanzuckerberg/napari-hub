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
