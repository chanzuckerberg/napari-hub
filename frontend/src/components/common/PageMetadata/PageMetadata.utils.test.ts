import { getPageMetadata } from './PageMetadata.utils';

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
      expect(getPageMetadata(pathname)).not.toBeNull(),
    );
  });

  it('should return null for no match', () => {
    expect(getPageMetadata('/non-existent')).toBeNull();
  });
});
