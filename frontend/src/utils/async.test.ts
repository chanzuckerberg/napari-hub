import axios from 'axios';

import { retryAsync, retryAxios } from './async';

describe('retryAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry promise fails', async () => {
    const expectedRetryCount = 2;
    let actualRetryCount = 0;

    async function execute() {
      if (actualRetryCount === expectedRetryCount) {
        return Promise.resolve();
      }

      actualRetryCount += 1;
      throw new Error('failure');
    }

    await retryAsync({ execute });
    expect(actualRetryCount).toBe(expectedRetryCount);
  });

  it('should fail when promise fails too many times', async () => {
    const expectedRetryCount = 3;
    let actualRetryCount = 0;

    // eslint-disable-next-line @typescript-eslint/require-await
    async function execute() {
      actualRetryCount += 1;
      throw new Error('failure');
    }

    await expect(
      retryAsync({ execute, retries: expectedRetryCount }),
    ).rejects.toThrow('failure');
    expect(actualRetryCount).toBe(expectedRetryCount);
  });
});

describe('retryAxios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry fetching a failed request', async () => {
    const expectedRetryCount = 2;
    let actualRetryCount = 0;
    jest.spyOn(axios, 'request').mockImplementation(() => {
      if (actualRetryCount === expectedRetryCount) {
        return Promise.resolve({
          data: 'data',
          status: 200,
        });
      }

      actualRetryCount += 1;
      throw new Error('failure');
    });

    const res = await retryAxios({ url: '/test' });
    expect(res.data).toBe('data');
    expect(actualRetryCount).toBe(expectedRetryCount);
  });

  it('should fail when the request fails too many times', async () => {
    const expectedRetryCount = 3;
    let actualRetryCount = 0;
    jest.spyOn(axios, 'request').mockImplementation(() => {
      actualRetryCount += 1;
      throw new Error('failure');
    });

    await expect(
      retryAxios({ url: '/test', retries: expectedRetryCount }),
    ).rejects.toThrow('failure');
    expect(actualRetryCount).toBe(expectedRetryCount);
  });
});
