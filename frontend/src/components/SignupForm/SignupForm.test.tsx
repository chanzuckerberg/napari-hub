import { fireEvent, render, screen } from '@testing-library/react';
import { FormEvent } from 'react';

import { FORM_CONTAINER_ID, SignupForm } from './SignupForm';

describe('<SignupForm />', () => {
  it('should match snapshot', () => {
    const component = render(<SignupForm />);
    expect(component.asFragment()).toMatchSnapshot();
  });

  it('should submit the form', () => {
    const onSubmit = jest.fn((event: FormEvent) => event.preventDefault());
    const { getByTestId } = render(
      <>
        <div id={FORM_CONTAINER_ID}>
          <form>
            <input />
          </form>
        </div>
        <SignupForm onSubmit={onSubmit} />
      </>,
    );
    const inputValue = 'example@example.com';

    fireEvent.change(getByTestId('emailField'), {
      target: { value: inputValue },
    });
    fireEvent.click(getByTestId('submitButton'));

    expect(screen.queryByTestId('emailError')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should not submit empty form', () => {
    const onSubmit = jest.fn((event: FormEvent) => event.preventDefault());
    const { getByTestId } = render(<SignupForm onSubmit={onSubmit} />);
    const inputValue = '';

    fireEvent.change(getByTestId('emailField'), {
      target: { value: inputValue },
    });
    fireEvent.click(getByTestId('submitButton'));

    expect(getByTestId('emailError').textContent).not.toBe('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should error on invalid email address', () => {
    const onSubmit = jest.fn((event: FormEvent) => event.preventDefault());
    const { getByTestId } = render(<SignupForm onSubmit={onSubmit} />);
    const inputValue = 'verybadinvalidemail';

    fireEvent.change(getByTestId('emailField'), {
      target: { value: inputValue },
    });
    fireEvent.click(getByTestId('submitButton'));

    expect(getByTestId('emailError').textContent).not.toBe('');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
