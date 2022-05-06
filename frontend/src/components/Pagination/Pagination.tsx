import clsx from 'clsx';
import { upperFirst } from 'lodash';

import { ChevronLeft, ChevronRight } from '@/components/icons';
import { BEGINNING_PAGE } from '@/constants/search';

import styles from './Pagination.module.scss';

interface Props {
  className?: string;
  onNextPage?(): void;
  onPrevPage?(): void;
  page: number;
  totalPages: number;
}

/**
 * Use constant widths for page numbers so that they don't cause layout shift.
 */
const PAGE_VALUE_CLASSES = 'inline-block text-center w-4';

/**
 * Component for rendering pagination controls. When set up with state, this can
 * be used to render a long list of results as multiple pages.
 */
export function Pagination({
  className,
  onNextPage,
  onPrevPage,
  page,
  totalPages,
}: Props) {
  /**
   * Render function for pagination buttons. Since the buttons are very similar,
   * are a lot of the code can be shared between components.
   *
   * @param type The pagination button type.
   */
  function renderPageButton(type: 'left' | 'right') {
    const isDisabled = page === (type === 'left' ? BEGINNING_PAGE : totalPages);

    return (
      <button
        className={clsx(
          styles.pageButton,
          'focus-visible:bg-napari-hover-gray hover:bg-napari-hover-gray',

          isDisabled && 'opacity-0 cursor-default',
          type === 'left' ? 'mr-2' : 'ml-2',
        )}
        data-testid={`pagination${upperFirst(type)}`}
        disabled={isDisabled}
        onClick={type === 'left' ? onPrevPage : onNextPage}
        type="button"
      >
        {type === 'left' ? <ChevronLeft /> : <ChevronRight />}
      </button>
    );
  }

  return (
    <nav
      className={clsx(
        className,
        'flex items-center justify-center',

        // Disable user selection so that the cursor doesn't flicker between the
        // default and select pointers.
        'select-none',
      )}
    >
      {renderPageButton('left')}

      <span className={styles.value} data-testid="paginationValue">
        <span className={PAGE_VALUE_CLASSES}>{page}</span>
        <span className="mx-4">/</span>
        <span className={PAGE_VALUE_CLASSES}>{totalPages}</span>
      </span>

      {renderPageButton('right')}
    </nav>
  );
}
