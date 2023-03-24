/* eslint-disable max-classes-per-file */

import axios from 'axios';

import { BROWSER } from '@/constants/env';
import { PluginData, PluginIndexData } from '@/types';
import { CollectionData, CollectionIndexData } from '@/types/collections';
import { PluginMetrics } from '@/types/metrics';

import {
  validateCollectionData,
  validateCollectionIndexData,
  validateMetricsData,
  validatePluginData,
  validatePluginIndexData,
} from './validate';

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

  async getPluginIndex(): Promise<PluginIndexData[]> {
    const { data } = await this.api.get<PluginIndexData[]>('/plugins/index');

    return data
      .map((plugin) => validatePluginIndexData(plugin))
      .filter((plugin) => !!plugin.name);
  }

  async getPlugin(name: string): Promise<PluginData> {
    const { data } = await this.api.get<PluginData | HubAPIErrorResponse>(
      `/plugins/${name}`,
    );

    if (isHubAPIErrorResponse(data)) {
      throw new HubAPIError(data);
    }

    return validatePluginData(data);
  }

  async getCollectionsIndex(): Promise<CollectionIndexData[]> {
    const { data } = await this.api.get<CollectionIndexData[]>('/collections');
    return data.map(validateCollectionIndexData);
  }

  async getCollection(name: string): Promise<CollectionData> {
    const { data } = await this.api.get<CollectionData>(`/collections/${name}`);
    return validateCollectionData(data);
  }

  async getPluginMetrics(name: string): Promise<PluginMetrics> {
    const { data } = await this.api.get<PluginMetrics>(`/metrics/${name}`);
    return validateMetricsData(data);
  }
}

export const hubAPI = new HubAPIClient();
