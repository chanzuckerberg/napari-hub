import clsx from 'clsx';
import { ButtonIcon } from 'czifui';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { HTMLProps, InputHTMLAttributes, useEffect, useState } from 'react';

import { Close, Search } from '@/components/icons';
import { createUrl, isSearchPage } from '@/utils';

import styles from './SearchBar.module.scss';

export interface Props
  extends Omit<
    HTMLProps<HTMLFormElement>,
    'value' | 'onChange' | 'onSubmit' | 'placeholder'
  > {
  /**
   * Manages staging state in search bar instead of using `value` directly. This
   * allows us to use the search bar in a way where the value isn't changed /
   * submitted until the user submits the form.
   */
  changeOnSubmit?: boolean;

  /**
   * Render large variant of search bar with a larger font size and search icon.
   */
  large?: boolean;

  /**
   * Additional props to pass to the input element.
   */
  inputProps?: InputHTMLAttributes<HTMLInputElement>;

  /**
   * Function for updating state when the input value changes.
   */
  onChange(value: string): void;

  /**
   * Function to call when form is submitted. This will be called for both when
   * the user submits or clears a query.
   */
  onSubmit(value: string): void;

  /**
   * The value of the search query input.
   */
  value: string;
}

/**
 * Search bar component. This renders an input field with a underline and
 * magnifying glass icon to the right of the component. When the user enters a query,
 * one of two things can happen:
 *
 * 1. User is on search page, so submitting a query re-renders the plugin list.
 *
 * 2. User is not on search page, so submitting a query redirects to the search
 * page with the `search=` URL parameter set.
 *
 * This makes the SearchBar component re-useable for non-search enabled pages.
 */
export function SearchBar({
  large,
  inputProps,
  value,
  onChange,
  onSubmit,
  changeOnSubmit,
  ...props
}: Props) {
  const [t] = useTranslation(['common']);
  const router = useRouter();
  const currentPathname = createUrl(router.asPath).pathname;

  // Local state for query. This is used to store the current entered query string.
  const [localQuery, setLocalQuery] = useState(value ?? '');

  const iconClassName = clsx(
    'h-5 w-5',

    // 22x22 pixels when root font-size is 16px
    large && 'h-[1.375rem] w-[1.375rem]',
  );

  // Keep local query state in sync with global query state in case it's changed elsewhere.
  useEffect(() => {
    if (changeOnSubmit) {
      setLocalQuery(value);
    }
  }, [changeOnSubmit, value]);

  function handleSubmit(query: string) {
    onSubmit(query);

    if (changeOnSubmit || !query) {
      onChange(query);
    }
  }

  return (
    <form
      data-testid="searchBarForm"
      className={clsx(
        // Flex layout
        'flex flex-auto items-center',

        // Borders
        'border-b-2 border-black',

        large && 'text-xl',
      )}
      onSubmit={(event) => {
        event.preventDefault();
        const query = changeOnSubmit ? localQuery : value;

        if (query) {
          handleSubmit(query);
        }
      }}
      {...props}
    >
      <input
        aria-label={t('common:ariaLabels.searchBar')}
        data-testid="searchBarInput"
        className={clsx(
          // Flex layout
          'flex flex-auto',

          // Remove border and focus outline around input
          'border-none outline-none',

          // Remove white colored input background
          'bg-transparent',

          // Change placeholder color
          'placeholder-gray-500',

          /*
            Inputs have a default width defined by the browser, so we have to
            set this explicitly to make the input flexible:
            https://stackoverflow.com/a/42421490
          */
          'w-0',
        )}
        onChange={(event) => {
          const newValue = event.target.value;

          if (changeOnSubmit) {
            setLocalQuery(newValue);
          } else {
            onChange(newValue);
          }
        }}
        value={changeOnSubmit ? localQuery : value}
        {...inputProps}
      />

      <ButtonIcon
        className="p-3"
        aria-label={t(
          value
            ? 'common:ariaLabels.clearSearchBar'
            : 'common:ariaLabels.submitSearchQuery',
        )}
        data-testid={value ? 'clearQueryButton' : 'submitQueryButton'}
        // Only allow click if user has entered a value into the search bar
        disabled={changeOnSubmit ? !localQuery : !value}
        onClick={() => {
          // Clear local query if close button is clicked and the search engine
          // is currently rendering the results for another query.
          let searchQuery = changeOnSubmit ? localQuery : value;

          if (value) {
            if (changeOnSubmit) {
              setLocalQuery('');
            }

            searchQuery = '';
          }

          handleSubmit(searchQuery);
        }}
        size="large"
        type="button"
      >
        {/* Render close button if the user submitted a query. */}
        {value && isSearchPage(currentPathname) ? (
          <Close className={clsx(iconClassName, styles.closeIcon)} />
        ) : (
          <Search className={iconClassName} />
        )}
      </ButtonIcon>
    </form>
  );
}
