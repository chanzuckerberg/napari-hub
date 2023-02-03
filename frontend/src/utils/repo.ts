import type { Octokit as OctokitInstance } from '@octokit/rest';
import type { RequestError as OctokitRequestError } from '@octokit/types';

import { DEFAULT_REPO_DATA } from '@/constants/plugin';
import { PluginRepoData, PluginRepoFetchError } from '@/types';

/**
 * Regex used for capturing the repo name in a repo URL.
 * Inspiration: https://regexr.com/4uvj8
 */
const REPO_REGEX = /(?:git@|https:\/\/)(github).com[/:](.*)(?:.git)?/;

export interface FetchRepoDataResult {
  repo: PluginRepoData;
  repoFetchError?: PluginRepoFetchError;
}

function isOctokitError(error: unknown): error is OctokitRequestError {
  return !!(error as OctokitRequestError).documentation_url;
}

let octokit: OctokitInstance | undefined;
export async function fetchRepoData(url: string): Promise<FetchRepoDataResult> {
  const result: FetchRepoDataResult = {
    repo: DEFAULT_REPO_DATA,
  };

  try {
    const match = REPO_REGEX.exec(url);

    if (match) {
      const [, type, name] = match;
      const [owner, repo] = name.split('/');

      if (type === 'github') {
        // Initialize octokit once on server
        if (!octokit) {
          const { Octokit } = await import('@octokit/rest');
          const { createOAuthAppAuth } = await import(
            '@octokit/auth-oauth-app'
          );

          // Authenticate as oauth app
          octokit = new Octokit({
            authStrategy: createOAuthAppAuth,
            auth: {
              clientId: process.env.GITHUB_CLIENT_ID,
              clientSecret: process.env.GITHUB_CLIENT_SECRET,
              clientType: 'oauth-app',
            },
          });
        }

        const { data, status } = await octokit.repos.get({
          owner,
          repo,
        });

        if (status === 200) {
          result.repo = {
            forks: data.forks_count,
            issuesAndPRs: data.open_issues_count,
            stars: data.stargazers_count,
            createdAt: data.created_at,
          };
        }
      } else if (type === 'gitlab') {
        // TODO Implement GitLab support
      }
    }
  } catch (err) {
    if (isOctokitError(err)) {
      result.repoFetchError = {
        name: err.name,
        status: err.status,
      };
    }
  }

  return result;
}
