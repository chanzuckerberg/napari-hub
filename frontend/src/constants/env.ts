export const PROD = process.env.ENV === 'prod';

export const STAGING = process.env.ENV === 'staging';

export const PREVIEW = !!process.env.PREVIEW;
