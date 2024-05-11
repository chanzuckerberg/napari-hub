/* eslint-disable no-param-reassign */

import axios from 'axios';

import { SpdxLicenseData, SpdxLicenseResponse } from '@/store/search/types';

import { retryAxios } from './async';
import { getErrorMessage } from './error';
import { Logger } from './logger';

export const spdxLicenseDataAPI = axios.create({
  baseURL:
    'https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json',
});

export async function getSpdxProps(
  logger?: Logger,
): Promise<SpdxLicenseData[]> {
  try {
    const {
      data: { licenses },
    } = await retryAxios<SpdxLicenseResponse>({ instance: spdxLicenseDataAPI });

    return licenses;
  } catch (err) {
    const error = getErrorMessage(err);
    logger?.error({
      message: 'Failed to fetch spdx license data',
      error,
    });

    return [];
  }
}
