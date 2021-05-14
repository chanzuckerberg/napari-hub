import clsx from 'clsx';
import React, { useState } from 'react';

import { ColumnLayout } from '@/components/common';

import styles from './SignupForm.module.scss';

/**
 * Signup form to capture email address and send it to MailChimp
 */
export function SignupForm() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // override default submission behavior
  };

  return (
    <ColumnLayout className="bg-napari-primary-light p-6 xl:px-0 xl:py-12">
      <div className="hidden 3xl:block 3xl:col-span-1" />
      <div className="col-span-2 md:col-span-3">
        <h3 className="prose-lg font-semibold mb-4">
          Sign up to receive updates
        </h3>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col md:flex-row gap-6 md:gap-12"
        >
          <input
            type="email"
            name="email"
            aria-label="email address"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={clsx(
              // font & colors
              'prose-sm bg-transparent focus:outline-none',
              // sizing
              'h-[24px] md:h-[35px] md:flex-2',
              // underline
              'border-b',
              isValid ? 'border-black' : 'border-napari-error',
            )}
          />
          <input
            type="submit"
            name="subscribe"
            value="Subscribe"
            className="h-[35px] md:flex-1 bg-napari-primary prose-sm font-semibold border-none"
          />
        </form>
      </div>
    </ColumnLayout>
  );
}
