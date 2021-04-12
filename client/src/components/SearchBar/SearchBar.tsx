import Image from 'next/image';

import styles from './SearchBar.module.scss';

const SEARCH_ICON_SIZE = 14;

/**
 * Search bar component. This renders an input field with a underline and
 * magnifying glass icon to the right of the component.
 */
export function SearchBar() {
  return (
    <form className={styles.form}>
      <input className={styles.input} />
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
