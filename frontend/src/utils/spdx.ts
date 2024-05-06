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

interface PropsResult {
  licenses?: SpdxLicenseData[];
  error?: string;
}

export async function getSpdxProps(logger?: Logger) {
  const props: PropsResult = {};

  try {
    const {
      data: { licenses },
    } = await retryAxios<SpdxLicenseResponse>();
    props.licenses = licenses;
  } catch (err) {
    props.error = getErrorMessage(err);
    logger?.error({
      message: 'Failed to fetch spdx license data',
      error: props.error,
    });
  }

  return props;
}
