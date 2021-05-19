import clsx from 'clsx';
import React, { useRef, useState } from 'react';

import { ColumnLayout } from '@/components/common';

// MailChimp form target
const MC_URL = new URL('https://dev.us5.list-manage.com/subscribe/post');
MC_URL.search = new URLSearchParams({
  u: '79f50c0d0474ff43dffedabda',
  id: '63bf16756e',
}).toString();

/**
 * Signup form to capture email address and send it to MailChimp
 */
export function SignupForm() {
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
    }
  };

  return (
    <ColumnLayout className="bg-napari-primary-light p-6 xl:px-0 xl:py-12">
      <div className="col-span-2 md:col-span-3 3xl:col-start-2">
        <h3 className="prose-lg font-semibold mb-4">
          Sign up to receive updates
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 xl:grid-cols-napari-3 gap-y-0.5 md:gap-x-12"
          noValidate
          action={MC_URL.href}
          method="post"
          target="_blank"
        >
          <input
            ref={emailRef}
            type="email"
            name="EMAIL"
            aria-label="email address"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={clsx(
              // font & colors
              'prose-sm bg-transparent focus:outline-none',
              // sizing
              'h-10 xl:h-[35px] col-span-2',
              // underline
              'border-b',
              !error ? 'border-black' : 'border-napari-error',
            )}
          />
          <span className="text-xs align-text-top h-[1.5em] text-napari-error xl:row-start-2 col-span-2">
            {error}
          </span>
          <input
            type="submit"
            name="subscribe"
            value="Subscribe"
            className={clsx(
              // font & colors
              'prose-sm font-semibold bg-napari-primary',
              // sizing
              'h-[35px] col-span-2 xl:col-span-1',
              // border & interaction
              'border-none cursor-pointer',
            )}
          />
        </form>
      </div>
    </ColumnLayout>
  );
}
