import { FormHelperTextProps } from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import { Button } from 'czifui';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { ColumnLayout } from '@/components/ColumnLayout';
import { usePlausible } from '@/hooks';
import { hubspotStore } from '@/store/hubspot';

export const FORM_CONTAINER_ID = 'hubspot-form-container';
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

    const emailInput =
      form?.querySelector<HTMLInputElement>('input[type=email]');

    const submitButton =
      form?.querySelector<HTMLInputElement>('input[type=submit]');

    if (!isValid || !form || !emailInput || !submitButton) {
      return;
    }

    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    submitButton.click();

    onSubmit?.(event);
    plausible('Signup');
  };

  const isHubSpotReady = useSnapshot(hubspotStore).ready;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

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
  }, [isHubSpotReady, router.asPath]);

  return (
    <ColumnLayout
      className="bg-hub-primary-200 p-sds-xl screen-495:p-12"
      // Use 3-column layout instead of 4-column layout.
      classes={isHome ? { fourColumn: 'screen-1150:grid-cols-napari-3' } : {}}
    >
      {/* Create hidden form for submitting the data to HubSpot */}
      <div id={FORM_CONTAINER_ID} className="hidden" />

      <div className="col-span-2 screen-495:col-span-3 screen-1425:col-start-2">
        <h2 className="text-lg font-semibold mb-sds-xxs screen-495:mb-sds-l">
          {t('footer:signUp.title')}
        </h2>

        {isSubmitted ? (
          <p>{t('footer:signUp.success')}</p>
        ) : (
          <form
            onSubmit={(event) => {
              // TODO Fix this hack.
              // Right now there's an issue with hubspot where the signup form
              // shows an error after the initial submission and then passes
              // after the 2nd one. This fixes it by doing `handleSubmit` twice
              // to simulate user clicking on it twice. Because the form becomes
              // invisible after submission, this code should be safe to run
              // because `handleSubmit` will not run unless the form is visible.
              handleSubmit(event);
              setTimeout(() => handleSubmit(event));
            }}
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
                'bg-hub-primary-400 hover:bg-hub-primary-500 active:bg-hub-primary-600',
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
