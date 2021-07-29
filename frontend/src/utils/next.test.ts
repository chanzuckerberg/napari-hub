import fs from 'fs';

import { getBuildManifest } from './next';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValueOnce(false),
  readFileSync: jest.fn().mockReturnValue('{}'),
}));

describe('getBuildManifest()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return manifest when found', () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
    expect(getBuildManifest()).toBeDefined();
  });

  it('should return null when not found', () => {
    expect(getBuildManifest()).toBeNull();
  });
});
