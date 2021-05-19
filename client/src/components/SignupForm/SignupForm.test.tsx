import { render, screen } from '@testing-library/react';

import { SignupForm } from './SignupForm';

describe('<SignupForm />', () => {
  it('should match snapshot', () => {
    const component = render(<SignupForm />);
    expect(component).toMatchSnapshot();
  });
});
