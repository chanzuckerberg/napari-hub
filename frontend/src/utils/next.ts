import fs from 'fs';
import { resolve } from 'path';

type ManifestFileName = 'build' | 'prerender';

/**
 * Reads a Next.js manifest file from the `.next` directory.
 *
 * @param name The name of the manifest file.
 * @returns The manifest file or null if it does not exist.
 */
function getManifestFile<T>(name: ManifestFileName): T | null {
  let cwd = __dirname;
  let manifestPath = '';
  let manifestFound = false;

  while (cwd !== '/' && !manifestFound) {
    manifestPath = resolve(cwd, `.next/${name}-manifest.json`);

    if (fs.existsSync(manifestPath)) {
      manifestFound = true;
    } else {
      cwd = resolve(cwd, '..');
    }
  }

  if (manifestFound) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as T;
  }

  return null;
}

export interface BuildManifest {
  polyfillFiles: string[];
  devFiles: string[];
  ampDevFiles: string[];
  lowPriorityFiles: string[];
  ampFirstPages: string[];
  pages: Record<string, string[]>;
}

/**
 * Function that finds the Next.js build manifest by traversing up the current
 * directory until `.next/build-manifest.json` is found.
 *
 * @returns The build manifest or null if it can't be found.
 */
export function getBuildManifest(): BuildManifest | null {
  return getManifestFile<BuildManifest>('build');
}

interface Preview {
  previewModeId: string;
  previewModeSigningKey: string;
  previewModeEncryptionKey: string;
}

interface DynamicRoute {
  routeRegex: string;
  dataRoute: string;
  fallback: boolean;
  dataRouteRegex: string;
}

interface Route {
  initialRevalidateSeconds: boolean;
  srcRoute: string | null;
  dataRoute: string;
}

export interface PreRenderManifest {
  version: number;
  routes: Record<string, Route>;
  dynamicRoutes: Record<string, DynamicRoute>;
  notFoundRoutes: unknown[];
  preview: Preview;
}

export function getPreRenderManifest(): PreRenderManifest | null {
  return getManifestFile<PreRenderManifest>('prerender');
}
