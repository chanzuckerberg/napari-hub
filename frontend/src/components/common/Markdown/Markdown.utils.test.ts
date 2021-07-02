import { TOCHeader } from '@/components/common/TableOfContents';

import { getHeadersFromMarkdown } from './Markdown.utils';

const MARKDOWN_WITHOUT_HEADERS = `
# Hello World!

This is markdown

### Level 3 header, but not level 2

markdown is cool.
`;

const MARKDOWN_WITH_HEADERS = `
# Hello World!

This is markdown

## Foo
## Bar
## Foo Bar
`;

describe('getHeadersFromMarkdown()', () => {
  it('should return empty array for empty markdown', () => {
    const headers = getHeadersFromMarkdown('');
    expect(headers).toHaveLength(0);
  });

  it('should return empty array when there are no headers', () => {
    const headers = getHeadersFromMarkdown(MARKDOWN_WITHOUT_HEADERS);

    expect(headers).toHaveLength(0);
  });

  it('should return array of headers', () => {
    const headers = getHeadersFromMarkdown(MARKDOWN_WITH_HEADERS);
    const expected: TOCHeader[] = [
      {
        id: 'foo',
        text: 'Foo',
      },
      {
        id: 'bar',
        text: 'Bar',
      },
      {
        id: 'foo-bar',
        text: 'Foo Bar',
      },
    ];

    expect(headers).toEqual(expected);
  });
});
