import { render, screen } from '@testing-library/react';

import { SignupForm } from './SignupForm';

describe('<SignupForm />', () => {
  const text = 'Hello, World!';

  it('should match snapshot', () => {
    const component = render(<SignupForm>{text}</SignupForm>);
    expect(component).toMatchSnapshot();
  });

  it('should render child', () => {
    render(<SignupForm>{text}</SignupForm>);
    expect(screen.getByText(text)).toBeTruthy();
  });
});
