import clsx from 'clsx';

import { Media } from '@/components/common/media';

import {
  MetadataSectionField,
  useMetadataSections,
} from './metadataPreview.hooks';
import { MetadataStatus } from './MetadataStatus';

/**
 * Creates a new array of metadata fields that have the missing metadata ordered
 * at the top.
 *
 * @param fields Fields for the current metadata section.
 * @returns The ordered fields.
 */
function getOrderedFields(fields: MetadataSectionField[]) {
  return [
    ...fields.filter((field) => !field.hasValue),
    ...fields.filter((field) => field.hasValue),
  ];
}

export function PreviewMetadataPanel() {
  const sections = useMetadataSections();

  const renderSections = () => (
    <>
      {sections.map((section) => {
        return (
          <section
            className={clsx(
              'space-y-4 relative',

              // Spacing for vertical list layout.
              'first:mt-0 mt-8',

              // Add margin to last item for "masonry" layout.
              'screen-725:mt-0 screen-725:last:mt-12',

              // Remove margins for horizontal layout.
              'screen-875:last:mt-0',
            )}
          >
            <h2 className="font-semibold">{section.title}</h2>

            <p className={clsx('text-xs')}>{section.description}</p>

            <ul className="space-y-3">
              {getOrderedFields(section.fields).map((field) => (
                <li className="flex items-center space-x-3" key={field.name}>
                  <MetadataStatus hasValue={field.hasValue} />
                  <span
                    className={clsx(
                      'text-sm',
                      !field.hasValue && 'font-semibold leading-[17.5px]',
                    )}
                  >
                    {field.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );

  return (
    <div
      className={clsx(
        'bg-napari-hover-gray',

        // Horizontal padding
        'px-9 screen-495:px-12',

        // Vertical padding
        'py-4 screen-875:py-6',
      )}
    >
      <Media
        className={clsx(
          'screen-725:grid screen-725:grid-cols-2 screen-725:gap-x-12',
        )}
        lessThan="screen-875"
      >
        {renderSections()}
      </Media>

      <Media
        className="grid grid-cols-napari-3 justify-center gap-12"
        greaterThanOrEqual="screen-875"
      >
        <div
          className={clsx(
            'col-span-3',
            'grid grid-cols-[repeat(4,9.75rem)]',
            'justify-center gap-x-12',
          )}
        >
          {renderSections()}
        </div>
      </Media>
    </div>
  );
}
