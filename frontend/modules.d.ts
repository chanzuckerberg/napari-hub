/* eslint-disable
  import/no-default-export,
  @typescript-eslint/no-explicit-any,
*/

declare module 'generate-robotstxt' {
  export interface RobotsPolicyEntry {
    userAgent: string;
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
    cleanParam?: string;
  }

  export interface Options {
    policy: RobotsPolicyEntry[];
    sitemap: string;
    host: string;
  }

  export default async function generateRobotsTxt(
    options: Options,
  ): Promise<string>;
}

declare module 'remark-remove-comments' {
  import { Pluggable, Settings } from 'unified';

  const plugin: Pluggable<any[], Settings>;
  export default plugin;
}

declare module '@renovate/pep440' {
  /**
   * Determines if a version string satisfies the version specifier. The
   * comparison is based on PEP440: https://www.python.org/dev/peps/pep-0440
   *
   * @param version The version string.
   * @param specifier  The version specifier.
   */
  export function satisfies(version: string, specifier: string): boolean;
}
