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
});
