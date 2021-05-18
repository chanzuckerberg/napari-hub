import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

describe('<Footer />', () => {
  const text = 'Hello, World!';

  it('should match snapshot', () => {
    const component = render(<Footer>{text}</Footer>);
    expect(component).toMatchSnapshot();
  });

  it('should render child', () => {
    render(<Footer>{text}</Footer>);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
