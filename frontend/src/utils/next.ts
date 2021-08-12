import fs from 'fs';
import { resolve } from 'path';

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
  let cwd = __dirname;
  let manifestPath = '';
  let manifestFound = false;

  while (cwd !== '/' && !manifestFound) {
    manifestPath = resolve(cwd, '.next/build-manifest.json');

    if (fs.existsSync(manifestPath)) {
      manifestFound = true;
    } else {
      cwd = resolve(cwd, '..');
    }
  }

  if (manifestFound) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as BuildManifest;
  }

  return null;
}
