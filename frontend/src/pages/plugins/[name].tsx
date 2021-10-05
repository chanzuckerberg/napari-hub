import type { Octokit as OctokitInstance } from '@octokit/rest';
import type { RequestError as OctokitRequestError } from '@octokit/types';
import { AxiosError } from 'axios';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'node:querystring';

import { hubAPI } from '@/axios';
import { PluginDetails } from '@/components';
import { ErrorMessage, PageMetadata } from '@/components/common';
import { PluginStateProvider } from '@/context/plugin';
import { PluginData, PluginRepoData, PluginRepoFetchError } from '@/types';

/**
 * Interface for parameters in URL.
 */
interface Params extends ParsedUrlQuery {
  name: string;
}

/**
 * Error returned by API server if a server error occurs.
 */
interface RequestError {
  errorMessage: string;
  errorType: string;
  stackTrace: string[];
}

interface Props {
  error?: string;
  plugin?: PluginData;
  repo?: PluginRepoData;
  repoFetchError?: PluginRepoFetchError;
}

type RequestResponse = PluginData | RequestError;

/**
 * Helper that checks if the request is an error on the server.
 */
function isRequestError(data: RequestResponse): data is RequestError {
  return !!(data as RequestError).errorType;
}

/**
 * Helper that checks if the plugin data is valid.
 */
function isPlugin(data: RequestResponse): data is RequestError {
  return !!(data as PluginData).name;
}

function isAxiosError(error: unknown): error is AxiosError {
  return !!(error as AxiosError).isAxiosError;
}

function isOctokitError(error: unknown): error is OctokitRequestError {
  return !!(error as OctokitRequestError).documentation_url;
}

/**
 * Regex used for capturing the repo name in a repo URL.
 * Inspiration: https://regexr.com/4uvj8
 */
const REPO_REGEX = /(?:git@|https:\/\/)(github).com[/:](.*)(?:.git)?/;

let octokit: OctokitInstance | undefined;

async function fetchRepoData(url: string): Promise<PluginRepoData | undefined> {
  const match = REPO_REGEX.exec(url);
  let repoData: PluginRepoData | undefined;

  if (match) {
    const [, type, name] = match;
    const [owner, repo] = name.split('/');

    if (type === 'github') {
      // Initialize octokit once on server
      if (!octokit) {
        const { Octokit } = await import('@octokit/rest');
        const { createOAuthAppAuth } = await import('@octokit/auth-oauth-app');

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
        repoData = {
          forks: data.forks_count,
          issuesAndPRs: data.open_issues_count,
          stars: data.stargazers_count,
        };
      }
    } else if (type === 'gitlab') {
      // TODO Implement GitLab support
    }
  }

  return repoData;
}

/**
 * Fetches plugin data from the hub API. The name of the plugin is extracted
 * from the URL `/plugins/:name` and used for fetching the plugin data.
 */
export async function getServerSideProps({
  params,
}: GetServerSidePropsContext<Params>) {
  const name = String(params?.name);
  const url = `/plugins/${name}`;
  const props: Partial<Props> = {};

  try {
    const { data } = await hubAPI.get<PluginData | RequestError>(url);

    if (isRequestError(data)) {
      props.error = JSON.stringify(data, null, 2);
    } else if (isPlugin(data)) {
      props.plugin = data;

      const repo = await fetchRepoData(data.code_repository);
      if (repo) {
        props.repo = repo;
      }
    }
  } catch (err) {
    if (isAxiosError(err)) {
      props.error = err.message;
    }

    if (isOctokitError(err)) {
      props.repoFetchError = {
        name: err.name,
        status: err.status,
      };
    }
  }

  return { props };
}

const defaultRepoData: PluginRepoData = {
  forks: 0,
  issuesAndPRs: 0,
  stars: 0,
};

/**
 * This page fetches plugin data from the hub API and renders it in the
 * PluginDetails component.
 */
export default function PluginPage({
  error,
  plugin,
  repo = defaultRepoData,
  repoFetchError,
}: Props) {
  const router = useRouter();

  const keywords: string[] = [];
  let title = 'napari hub | plugins';
  if (plugin?.name && plugin?.authors) {
    title = `${title} | ${plugin.name}`;

    const authors = plugin.authors.map(({ name }) => name).join(', ');
    if (authors) {
      title = `${title} by ${authors}`;
    }

    keywords.push(plugin.name, ...plugin.authors.map(({ name }) => name));
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <PageMetadata keywords={keywords} description={plugin?.summary} />
      </Head>

      {error ? (
        <ErrorMessage error={error}>Unable to load plugin</ErrorMessage>
      ) : (
        <>
          {plugin ? (
            <PluginStateProvider
              plugin={plugin}
              repo={repo}
              repoFetchError={repoFetchError}
            >
              <PluginDetails />
            </PluginStateProvider>
          ) : (
            <ErrorMessage>Empty plugin data</ErrorMessage>
          )}
        </>
      )}
    </>
  );
}
