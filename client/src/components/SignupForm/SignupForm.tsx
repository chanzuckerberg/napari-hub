import { Button, TextField } from '@material-ui/core';
import clsx from 'clsx';
import React, { useRef, useState } from 'react';

import { ColumnLayout } from '@/components/common';

// MailChimp form target
const MC_URL = new URL('https://dev.us5.list-manage.com/subscribe/post');
MC_URL.search = new URLSearchParams({
  u: '79f50c0d0474ff43dffedabda',
  id: '63bf16756e',
}).toString();

interface Props {
  onSubmit?: (event: React.FormEvent) => void;
}

/**
 * Signup form to capture email address and send it to MailChimp
 */
export function SignupForm({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement | null>(null);

  const validate = () => {
    const validityState = emailRef.current?.validity;

    if (validityState?.valueMissing) {
      setError('Please enter an email address');
      return false;
    }
    if (validityState?.typeMismatch) {
      setError('Please provide a valid email address');
      return false;
    }

    setError(''); // no error
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    const isValid = validate();

    if (!isValid) {
      event.preventDefault(); // do not submit form
    } else if (onSubmit) {
      onSubmit(event);
    }
  };

  return (
    <ColumnLayout className="bg-napari-light p-6 screen-495:p-12">
      <div className="col-span-2 screen-495:col-span-3 screen-1425:col-start-2">
        <h3 className="text-lg font-semibold mb-4">
          Sign up to receive updates
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 screen-875:grid-cols-napari-3 gap-y-0.5 screen-495:gap-x-12"
          noValidate
          action={MC_URL.href}
          method="post"
          target="_blank"
        >
          <TextField
            inputRef={emailRef}
            error={error !== ''}
            helperText={error}
            type="email"
            name="EMAIL"
            aria-label="email address"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            margin="none"
            className={clsx(
              // font
              'text-sm',
              // make underline align with submit button
              'justify-end',
              // sizing
              'h-10 screen-495:h-[35px] col-span-2 screen-495:col-span-1 screen-875:col-span-2',
            )}
            inputProps={{ 'data-testid': 'emailField' }}
            FormHelperTextProps={{ 'data-testid': 'emailError ' }}
          />
          <Button
            type="submit"
            color="primary"
            name="subscribe"
            variant="contained"
            disableElevation
            className={clsx(
              // font & colors
              'text-sm font-semibold',
              // sizing
              'h-[35px] col-span-2 screen-495:col-span-1',
            )}
            data-testid="submitButton"
          >
            Subscribe
          </Button>
        </form>
      </div>
    </ColumnLayout>
  );
}
