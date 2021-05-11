import clsx from 'clsx';
import React, { useState } from 'react';

import styles from './SignupForm.module.scss';

/**
 * Signup form to capture email address and send it to MailChimp
 */
export function SignupForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // override default submission behavior
  };

  return (
    <div
      className={clsx(
        // Color and height
        'bg-napari-primary-light',

        // Padding
        'p-8',

        // Grid layout
        'justify-center items-center',

        // Grid gap
        'gap-6 md:gap-12',

        // Change to 2 column grid layout when 2xl+ screens
        '2xl:grid 2xl:grid-cols-napari-app-bar-2-col',

        // Use 3 column layout when 3xl+ screens
        '3xl:grid 3xl:grid-cols-napari-3-col',
      )}
    >
      <div />
      <div>
        <h3 className="prose-lg font-semibold mb-4">
          Sign up to receive updates
        </h3>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-6 md:gap-12"
        >
          <input
            type="email"
            name="email"
            aria-label="email address"
            placeholder="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-[24px] md:h-[35px] md:flex-2 bg-transparent border-b border-black prose-sm"
          />
          <input
            type="submit"
            name="subscribe"
            value="Subscribe"
            className="h-[35px] md:flex-1 bg-napari-primary prose-sm font-semibold border-none"
          />
        </form>
      </div>
    </div>
  );
}
