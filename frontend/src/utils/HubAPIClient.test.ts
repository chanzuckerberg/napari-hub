import axios, { AxiosInstance } from 'axios';

import mockPlugin from '@/fixtures/plugin.json';

import { HubAPIClient } from './HubAPIClient';
import { validatePluginData } from './validate';

describe('HubAPIClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry fetching a failed request', async () => {
    let retryCount = 0;
    jest.spyOn(axios, 'create').mockImplementation(() => {
      return {
        request: jest.fn(() => {
          if (retryCount > 1) {
            return Promise.resolve({
              data: mockPlugin,
              status: 200,
            });
          }

          retryCount += 1;
          throw new Error('failure');
        }),
      } as unknown as AxiosInstance;
    });

    const client = new HubAPIClient();
    await expect(client.getPlugin('test')).resolves.toEqual(
      validatePluginData(mockPlugin),
    );
  });

  it('should fail when the request fails too many times', async () => {
    jest.spyOn(axios, 'create').mockImplementation(() => {
      return {
        request: jest.fn().mockRejectedValue(new Error('failure')),
      } as unknown as AxiosInstance;
    });

    const client = new HubAPIClient();
    await expect(client.getPlugin('test')).rejects.toThrow('failure');
  });
});
