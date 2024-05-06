/* eslint-disable no-await-in-loop */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosStatic,
} from 'axios';

import { Logger } from './logger';
import { sleep } from './sleep';
import { getFullPathFromAxios } from './url';

/**
 * Max number of times to retry fetching a request.
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Backoff factory for increasing the delay when re-fetching requests.
 */
const DEFAULT_RETRY_BACKOFF_FACTOR = 2;

/**
 * Initial delay before retrying a request in milliseconds.
 */
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;

interface AsyncRetryOptions<T> {
  backoffFactor?: number;
  execute(): Promise<T>;
  initialDelay?: number;
  onError?(data: { err: Error; isRetrying: boolean; retry: number }): void;
  retries?: number;
}

export async function retryAsync<T>({
  backoffFactor = DEFAULT_RETRY_BACKOFF_FACTOR,
  execute,
  initialDelay = DEFAULT_INITIAL_RETRY_DELAY_MS,
  onError,
  retries = DEFAULT_MAX_RETRIES,
}: AsyncRetryOptions<T>) {
  let retryDelay = initialDelay;

  for (let retry = 0; retry < retries; retry += 1) {
    try {
      return await execute();
    } catch (err) {
      const isRetrying = retry < retries - 1;

      onError?.({
        isRetrying,
        retry,
        err: err as Error,
      });

      if (isRetrying) {
        await sleep(retryDelay);
        retryDelay *= backoffFactor;
      } else {
        throw err;
      }
    }
  }

  // edge case should not happen, but needed for typescript to not throw error
  throw new Error('Failed to execute function');
}

interface AsyncAxiosRetryOptions<T>
  extends Omit<AsyncRetryOptions<AxiosResponse<T>>, 'execute' | 'onError'> {
  config?: AxiosRequestConfig;
  instance?: AxiosInstance | AxiosStatic;
  logger?: Logger;
  url?: string;
}

export async function retryAxios<T>({
  config,
  instance = axios,
  logger,
  url = '/',
  ...options
}: AsyncAxiosRetryOptions<T> = {}) {
  const method = config?.method ?? 'GET';
  const path = getFullPathFromAxios(url, config);

  return retryAsync<AxiosResponse<T>>({
    ...options,
    execute: () => instance.request({ url, ...config }),
    onError({ err, isRetrying, retry }) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const level =
          isRetrying || (status !== undefined && status >= 400 && status < 500)
            ? 'warn'
            : 'error';

        logger?.[level]({
          message: 'Error sending request',
          error: err.message,
          method,
          path,
          url,
          isRetrying,
          retry,
          ...(err.response?.status ? { status: err.response.status } : {}),
        });
      }
    },
  });
}
