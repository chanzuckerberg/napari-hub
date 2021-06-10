import { render } from '@testing-library/react';

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
    const { queryByTestId } = render(
      <Markdown>
        https://user-images.githubusercontent.com/example.mp4
      </Markdown>,
    );
    expect(queryByTestId('markdownVideo')).toBeTruthy();
  });

  it('should not render non-GitHub videos in markdown', () => {
    const { queryByTestId } = render(
      <Markdown>https://example.com/example.mp4</Markdown>,
    );
    expect(queryByTestId('markdownVideo')).toBeFalsy();
  });

  it('should not render GitHub videos in paragraphs', () => {
    const { queryByTestId } = render(
      <Markdown>
        Foo bar https://user-images.githubusercontent.com/example.mp4
      </Markdown>,
    );
    expect(queryByTestId('markdownVideo')).toBeFalsy();
  });
});
