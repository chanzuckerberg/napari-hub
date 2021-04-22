import clsx from 'clsx';
import Image from 'next/image';

const SEARCH_ICON_SIZE = 14;

/**
 * Search bar component. This renders an input field with a underline and
 * magnifying glass icon to the right of the component.
 */
export function SearchBar() {
  return (
    <form
      className={clsx(
        // Flex layout
        'flex flex-auto items-center',

        // Borders
        'border-b-2 border-black',
      )}
    >
      <input
        className={clsx(
          // Flex layout
          'flex flex-auto',

          // Remove border and focus outline around input
          'border-none outline-none',

          // Remove white colored input background
          'bg-transparent',

          /*
            Inputs have a default width defined by the browser, so we have to
            set this explicitly to make the input flexible:
            https://stackoverflow.com/a/42421490
          */
          'w-0',
        )}
      />
      <Image
        src="/icons/search.svg"
        alt="Icon for napari search bar"
        layout="fixed"
        width={SEARCH_ICON_SIZE}
        height={SEARCH_ICON_SIZE}
      />
    </form>
  );
}
