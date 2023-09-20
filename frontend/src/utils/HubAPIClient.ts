/* eslint-disable max-classes-per-file */

import axios, { AxiosRequestConfig } from 'axios';

import { BROWSER, DEV, PROD, SERVER, STAGING } from '@/constants/env';
import {
  PluginData,
  PluginIndexData,
  PluginMetrics,
  PluginSectionsResponse,
  PluginSectionType,
} from '@/types';

import { Logger } from './logger';
import { getFullPathFromAxios } from './url';
import {
  validateMetricsData,
  validatePluginData,
  validatePluginIndexData,
} from './validate';

const logger = new Logger('HubAPIClient.ts');

/**
 * URL to hub API to make requests to.
 */
const API_URL = (() => {
  if (PROD) {
    return 'https://api.napari-hub.org';
  }

  if (STAGING) {
    return 'https://api.staging.napari-hub.org';
  }

  if (DEV) {
    return 'https://api.dev.napari-hub.org/dev-shared';
  }

  return process.env.API_URL || 'http://localhost:8081';
})();

/**
 * Host to use for Host header when making requests. Setting this is required
 * during local development because AWS API Gateway performs a host check for
 * API requests.
 */
const API_URL_HOST = process.env.API_URL_HOST || new URL(API_URL).host;

/**
 * Error returned by API server if a server error occurs.
 */
export interface HubAPIErrorResponse {
  errorMessage: string;
  errorType: string;
  stackTrace: string[];
}

export class HubAPIError extends Error {
  constructor(public apiError: HubAPIErrorResponse) {
    super(apiError.errorMessage);
  }
}

type RequestResponse = PluginData | HubAPIErrorResponse;

function isHubAPIErrorResponse(
  data: RequestResponse,
): data is HubAPIErrorResponse {
  return !!(data as HubAPIErrorResponse).errorType;
}

/**
 * Class for interacting with the hub API. Each function makes a request to the
 * hub API and runs client-side data validation on the data to ensure
 * consistency with static typing and reduce the chance of errors occurring.
 */
class HubAPIClient {
  private api = axios.create({
    baseURL: API_URL,
    headers: BROWSER
      ? undefined
      : {
          Host: API_URL_HOST,
        },
  });

  private async sendRequest<T>(url: string, config?: AxiosRequestConfig<T>) {
    const method = config?.method ?? 'GET';
    const path = getFullPathFromAxios(url, config);

    try {
      const { data, status } = await this.api.request<T>({
        url,
        ...config,
      });

      if (SERVER) {
        logger.info({
          path,
          method,
          url,
          status,
        });
      }

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        logger.error({
          message: 'Error sending request',
          error: err.message,
          method,
          path,
          url,
          ...(err.response?.status ? { status: err.response.status } : {}),
        });
      }

      throw err;
    }
  }

  async getPluginIndex(): Promise<PluginIndexData[]> {
    const data = await this.sendRequest<PluginIndexData[]>('/plugins/index');

    return data
      .map((plugin) => validatePluginIndexData(plugin))
      .filter((plugin) => !!plugin.name);
  }

  async getPlugin(name: string): Promise<PluginData> {
    const data = await this.sendRequest<PluginData | HubAPIErrorResponse>(
      `/plugins/${name}`,
    );

    if (isHubAPIErrorResponse(data)) {
      throw new HubAPIError(data);
    }

    return validatePluginData(data);
  }

  async getPluginMetrics(name: string): Promise<PluginMetrics> {
    const data = await this.sendRequest<PluginMetrics>(`/metrics/${name}`, {});
    return validateMetricsData(data);
  }

  async getPluginSections(
    sections: PluginSectionType[],
  ): Promise<PluginSectionsResponse> {
    if (sections.length === 0) {
      return {};
    }

    return this.sendRequest<PluginSectionsResponse>(
      `/plugin/home/sections/${sections.join(',')}`,
    );
  }
}

export const hubAPI = new HubAPIClient();
