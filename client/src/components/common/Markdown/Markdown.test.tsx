import { cleanup, render } from '@testing-library/react';

import { Markdown } from './Markdown';

describe('<Markdown />', () => {
  it('should match snapshot', () => {
    const { asFragment } = render(<Markdown># Hello World</Markdown>);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should disable H1 headers', () => {
    const { queryByText } = render(
      <Markdown disableHeader># Hello World</Markdown>,
    );
    expect(queryByText('Hello World')).toBeFalsy();
  });

  it('should render GitHub videos in markdown', () => {
    const testCases = [
      'https://user-images.githubusercontent.com/example.mp4',
      'https://user-images.githubusercontent.com/example.mov',
    ];

    testCases.forEach((input) => {
      const { queryByTestId } = render(<Markdown>{input}</Markdown>);
      expect(queryByTestId('markdownVideo')).toBeTruthy();
      cleanup();
    });
  });

  it('should not render non-GitHub videos in markdown', () => {
    const testCases = [
      'https://example.com/example.mp4',
      'https://example.com/example.mov',
    ];

    testCases.forEach((input) => {
      const { queryByTestId } = render(<Markdown>{input}</Markdown>);
      expect(queryByTestId('markdownVideo')).toBeFalsy();
    });
  });

  it('should not render GitHub videos in paragraphs', () => {
    const testCases = [
      'foo bar https://user-images.githubusercontent.com/example.mp4',
      'https://user-images.githubusercontent.com/example.mov hello world',
    ];

    testCases.forEach((input) => {
      const { queryByTestId } = render(<Markdown>{input}</Markdown>);
      expect(queryByTestId('markdownVideo')).toBeFalsy();
    });
  });
});
