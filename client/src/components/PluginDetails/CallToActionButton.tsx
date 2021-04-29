import clsx from 'clsx';

export function CallToActionButton() {
  return (
    <button
      className={clsx(
        'bg-napari-primary',

        // Keep button on screen when scrolling on 2xl.
        '2xl:fixed',

        /*
          3.125rem = 50px when font size is 16px, and 3.125rem ~ 34px when
          the font size is 11px.  This allows the height to scale between xs
          and md screens.

          For md screens, the height changes to 50px to take on its max size.
        */
        'h-[3.125rem] w-full md:h-[50px] lg:max-w-napari-side-col',
      )}
      type="button"
    >
      Install
    </button>
  );
}
