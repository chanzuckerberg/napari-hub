import fs from 'fs';

import { getBuildManifest } from './next';

jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');

describe('getBuildManifest()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return manifest when found', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    expect(getBuildManifest()).not.toBeNull();
  });

  it('should return null when not found', () => {
    expect(getBuildManifest()).toBeNull();
  });
});
