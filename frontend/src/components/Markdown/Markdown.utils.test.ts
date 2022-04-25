import { TOCHeader } from '@/components/TableOfContents';

import {
  getHeadersFromMarkdown,
  Token,
  transformTokens,
} from './Markdown.utils';

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

const MARKDOWN_WITH_INVALID_HEADERS = `
## Foo
## ![image](./invalid.png)
## Bar
## ![image](./invalid-2.jpg)
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

  it('should ignore invalid headers', () => {
    const headers = getHeadersFromMarkdown(MARKDOWN_WITH_INVALID_HEADERS);
    const expected: TOCHeader[] = [
      {
        id: 'foo',
        text: 'Foo',
      },
      {
        id: 'bar',
        text: 'Bar',
      },
    ];

    expect(headers).toEqual(expected);
  });
});

describe('transformTokens()', () => {
  it('should remove the last line', () => {
    const tokens: Token[][] = [[{ types: ['plain'], content: 'hello' }]];
    expect(transformTokens(tokens)).toEqual(tokens);

    const tokensWithEmptyLine = [
      ...tokens,
      [{ types: ['plain'], content: '', empty: true }],
    ];
    expect(transformTokens(tokensWithEmptyLine)).toEqual(tokens);
  });
});
