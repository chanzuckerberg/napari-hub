/* eslint-disable max-classes-per-file */

import axios, { AxiosRequestConfig } from 'axios';
import { snapshot } from 'valtio';

import { BROWSER, PROD, SERVER, STAGING } from '@/constants/env';
import { featureFlagsStore } from '@/store/featureFlags';
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

interface DynamoConfig {
  METRICS_USAGE_MIGRATION: boolean;
  METRICS_MAINTENANCE_MIGRATION: boolean;
  CATEGORY_MIGRATION: boolean;
  PLUGIN_MIGRATION: boolean;
}

const DEFAULT_DYNAMO_CONFIG: DynamoConfig = {
  METRICS_USAGE_MIGRATION: false,
  METRICS_MAINTENANCE_MIGRATION: false,
  CATEGORY_MIGRATION: false,
  PLUGIN_MIGRATION: false,
};

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

  private get dynamoConfig() {
    return (
      (snapshot(featureFlagsStore).s3ToDynamoMigration.config as unknown as
        | DynamoConfig
        | undefined) ?? DEFAULT_DYNAMO_CONFIG
    );
  }

  private async sendRequest<T>(url: string, config?: AxiosRequestConfig<T>) {
    const method = config?.method ?? 'GET';
    const path = getFullPathFromAxios(url, config);

    try {
      const { data, status } = await this.api.request<T>({
        url,
        ...config,
      });

      if (SERVER) {
        logger.info(`method=${method} url=${url} status=${status}`);
      }

      return data;
    } catch (err) {
      if (SERVER && axios.isAxiosError(err)) {
        logger.error(
          [
            `method=${method}`,
            `url=${path}`,
            err.response?.status ? `status=${err.response.status}` : '',
            `error="${err.message}"`,
          ]
            .filter(Boolean)
            .join(' '),
        );
      }

      throw err;
    }
  }

  async getPluginIndex(): Promise<PluginIndexData[]> {
    const data = await this.sendRequest<PluginIndexData[]>('/plugins/index', {
      params: {
        use_dynamo_plugin: this.dynamoConfig.PLUGIN_MIGRATION,
      },
    });

    return data
      .map((plugin) => validatePluginIndexData(plugin))
      .filter((plugin) => !!plugin.name);
  }

  async getPlugin(name: string): Promise<PluginData> {
    const data = await this.sendRequest<PluginData | HubAPIErrorResponse>(
      `/plugins/${name}`,
      {
        params: {
          use_dynamo_plugin: this.dynamoConfig.PLUGIN_MIGRATION,
        },
      },
    );

    if (isHubAPIErrorResponse(data)) {
      throw new HubAPIError(data);
    }

    return validatePluginData(data);
  }

  async getPluginMetrics(name: string): Promise<PluginMetrics> {
    const data = await this.sendRequest<PluginMetrics>(`/metrics/${name}`, {
      params: {
        use_dynamo_metric_usage: this.dynamoConfig.METRICS_USAGE_MIGRATION,
        use_dynamo_metric_maintenance:
          this.dynamoConfig.METRICS_MAINTENANCE_MIGRATION,
      },
    });
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
