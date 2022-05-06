import Button from '@material-ui/core/Button';
import { FormHelperTextProps } from '@material-ui/core/FormHelperText';
import TextField from '@material-ui/core/TextField';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import React, { useRef, useState } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { usePlausible } from '@/hooks';

// MailChimp form target
const MC_URL = new URL('https://dev.us5.list-manage.com/subscribe/post');
MC_URL.search = new URLSearchParams({
  u: '79f50c0d0474ff43dffedabda',
  id: '63bf16756e',
}).toString();

interface Props {
  onSubmit?: (event: React.FormEvent) => void;
  variant?: 'default' | 'home';
}

/**
 * Signup form to capture email address and send it to MailChimp
 */
export function SignupForm({ onSubmit, variant = 'default' }: Props) {
  const [t] = useTranslation(['footer']);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement | null>(null);
  const plausible = usePlausible();
  const isHome = variant === 'home';

  const validate = () => {
    const validityState = emailRef.current?.validity;

    if (validityState?.valueMissing) {
      setError(t('footer:signUp.missingEmail'));
      return false;
    }
    if (validityState?.typeMismatch) {
      setError(t('footer:signUp.invalidEmail'));
      return false;
    }

    setError(''); // no error
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    const isValid = validate();

    if (isValid) {
      onSubmit?.(event);
      plausible('Signup');
    } else {
      event.preventDefault(); // do not submit form
    }
  };

  return (
    <ColumnLayout
      className="bg-napari-light p-6 screen-495:p-12"
      // Use 3-column layout instead of 4-column layout.
      classes={isHome ? { fourColumn: 'screen-1150:grid-cols-napari-3' } : {}}
    >
      <div className="col-span-2 screen-495:col-span-3 screen-1425:col-start-2">
        <h3 className="text-lg font-semibold mb-1 screen-495:mb-4">
          {t('footer:signUp.title')}
        </h3>
        <form
          onSubmit={handleSubmit}
          noValidate
          action={MC_URL.href}
          method="post"
          target="_blank"
          className={clsx(
            // grid
            'grid grid-cols-2 screen-875:grid-cols-napari-3',
            // spacing
            'screen-495:gap-x-12',
            // make room for error message in vertical layout
            error ? 'gap-y-8' : 'gap-y-3.5',
          )}
        >
          <TextField
            inputRef={emailRef}
            error={error !== ''}
            helperText={error}
            type="email"
            name="EMAIL"
            aria-label={t('footer:ariaLabels.emailAddress')}
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            margin="none"
            className={clsx(
              // font
              'text-sm',
              // make underline align with submit button
              'pt-0.5',
              // sizing
              'h-8 screen-495:h-[35px] col-span-2 screen-495:col-span-1 screen-875:col-span-2',
            )}
            inputProps={{ 'data-testid': 'emailField' }}
            FormHelperTextProps={
              { 'data-testid': 'emailError' } as FormHelperTextProps
            }
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
            {t('footer:signUp.subscribe')}
          </Button>
        </form>
      </div>
    </ColumnLayout>
  );
}
