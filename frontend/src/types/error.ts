import { RequestError } from '@octokit/types';

export type PluginRepoFetchError = Pick<RequestError, 'name' | 'status'>;
