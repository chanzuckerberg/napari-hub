import Button from '@mui/material/Button';
import { FormHelperTextProps } from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import Script from 'next/script';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useRef, useState } from 'react';

import { ColumnLayout } from '@/components/ColumnLayout';
import { usePlausible } from '@/hooks';

const FORM_CONTAINER_ID = 'hubspot-form-container';
const FORM_CONTAINER_ID_QUERY = `#${FORM_CONTAINER_ID}`;

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
    event.preventDefault();
    const isValid = validate();
    const form: HTMLFormElement | null = isValid
      ? document.querySelector(`${FORM_CONTAINER_ID_QUERY} form`)
      : null;

    if (!isValid || !form) {
      return;
    }

    const input = form.querySelector('input');
    if (!input) {
      return;
    }

    input.value = email;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    form.submit();
    onSubmit?.(event);
    plausible('Signup');
  };

  const [isHubSpotReady, setIsHubSpotReady] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.textContent?.includes('Thank you for joining our newsletter.')
          ) {
            setIsSubmitted(true);
          }
        }
      }
    });

    if (isHubSpotReady) {
      hbspt.forms.create({
        region: 'na1',
        portalId: '7272273',
        formId: '82d2c175-74bb-4e73-aa48-d0ec966b51a9',
        target: FORM_CONTAINER_ID_QUERY,
      });

      const form = document.querySelector(FORM_CONTAINER_ID_QUERY);
      if (form) {
        observer.observe(form, {
          childList: true,
          subtree: true,
        });
      }
    }

    return () => observer.disconnect();
  }, [isHubSpotReady]);

  return (
    <ColumnLayout
      className="bg-napari-light p-sds-xl screen-495:p-12"
      // Use 3-column layout instead of 4-column layout.
      classes={isHome ? { fourColumn: 'screen-1150:grid-cols-napari-3' } : {}}
    >
      <Script
        onLoad={() => setIsHubSpotReady(true)}
        src="//js.hsforms.net/forms/v2.js?pre=1"
      />

      {/* Create hidden form for submitting the data to HubSpot */}
      <div id={FORM_CONTAINER_ID} className="hidden" />

      <div className="col-span-2 screen-495:col-span-3 screen-1425:col-start-2">
        <h3 className="text-lg font-semibold mb-sds-xxs screen-495:mb-sds-l">
          {t('footer:signUp.title')}
        </h3>

        {isSubmitted ? (
          <p>{t('footer:signUp.success')}</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className={clsx(
              // grid
              'grid grid-cols-2 screen-875:grid-cols-napari-3',
              // spacing
              'screen-495:gap-x-12',
              // make room for error message in vertical layout
              error ? 'gap-y-sds-xxl' : 'gap-y-sds-l',
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
                'pt-sds-xxxs',
                // sizing
                'h-8 screen-495:h-[35px] col-span-2 screen-495:col-span-1 screen-875:col-span-2',
              )}
              inputProps={{ 'data-testid': 'emailField' }}
              FormHelperTextProps={
                { 'data-testid': 'emailError' } as FormHelperTextProps
              }
              variant="standard"
            />
            <Button
              type="submit"
              color="primary"
              name="subscribe"
              variant="contained"
              disableElevation
              className={clsx(
                'bg-napari-primary',
                // font & colors
                'text-sm font-semibold text-black',
                // sizing
                'h-[35px] col-span-2 screen-495:col-span-1',
              )}
              data-testid="submitButton"
            >
              {t('footer:signUp.subscribe')}
            </Button>
          </form>
        )}
      </div>
    </ColumnLayout>
  );
}
