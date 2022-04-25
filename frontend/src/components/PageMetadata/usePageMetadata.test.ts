import { usePageMetadata } from './usePageMetadata';

describe('getPageMetadata', () => {
  it('should get metadata for match', () => {
    const testCases = [
      '/',
      '/about',
      '/faq',
      '/contact',
      '/privacy',
      '/plugins/napari-example',
    ];

    testCases.forEach((pathname) =>
      expect(usePageMetadata(pathname)).toBeDefined(),
    );
  });

  it('should return undefined for no match', () => {
    expect(usePageMetadata('/non-existent')).toBeUndefined();
  });
});
