import { render, screen } from '@testing-library/react';

import { Link } from './Link';

describe('<Link />', () => {
  const text = 'Hello, World!';

  it('should match snapshot', () => {
    const component = render(<Link href="https://example.com">{text}</Link>);
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should render child', () => {
    render(<Link href="https://example.com">{text}</Link>);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
