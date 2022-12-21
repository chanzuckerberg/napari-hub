export const PROD = process.env.ENV === 'prod';

export const STAGING = process.env.ENV === 'staging';

export const E2E = process.env.E2E === 'true';

export const PREVIEW = !!process.env.PREVIEW;

export const BROWSER = typeof window !== 'undefined';
