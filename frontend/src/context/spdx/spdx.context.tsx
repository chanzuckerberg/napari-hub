import { createContext, ReactNode, useContext, useRef } from 'react';

import { SpdxLicenseData } from './spdx.types';

interface SpdxContext {
  /**
   * Checks if the license is OSI approved based on the SPDX license data.
   *
   * @param license The license ID string
   */
  isOSIApproved(license: string): boolean;
}

interface Props {
  children: ReactNode;
  licenses: SpdxLicenseData[];
}

const SpdxLicenseContext = createContext<SpdxContext | null>(null);

/**
 * Hook for accessing the search state context.
 */
export function useSpdx(): SpdxContext {
  const spdx = useContext(SpdxLicenseContext);

  if (!spdx) {
    throw new Error('useSpdx() must be used in a SpdxLicenseProvider');
  }

  return spdx;
}

/**
 * Provider for storing SPDX license data and providing an API for getting
 * license information.
 */
export function SpdxLicenseProvider({ children, licenses }: Props) {
  // Use ref so that we only create the set once.
  const osiApprovedLicenseSetRef = useRef<Set<string> | undefined>();

  if (!osiApprovedLicenseSetRef.current) {
    osiApprovedLicenseSetRef.current = new Set(
      licenses
        .filter((license) => license.isOsiApproved)
        .map((license) => license.licenseId),
    );
  }

  function isOSIApproved(license: string): boolean {
    return osiApprovedLicenseSetRef?.current?.has(license) ?? false;
  }

  return (
    <SpdxLicenseContext.Provider value={{ isOSIApproved }}>
      {children}
    </SpdxLicenseContext.Provider>
  );
}
