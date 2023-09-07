export const PROD = process.env.ENV === 'prod';

export const STAGING = process.env.ENV === 'staging';

export const E2E = process.env.E2E === 'true';

export const BROWSER = typeof window !== 'undefined';

export const SERVER = !BROWSER;
