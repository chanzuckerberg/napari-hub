import Button from '@mui/material/Button';
import clsx from 'clsx';
import { createElement } from 'react';

import { MetadataStatus } from '@/components/MetadataStatus';
import { previewStore } from '@/store/preview';
import { setUrlHash } from '@/utils';

import {
  MetadataSectionField,
  useMetadataSections,
} from './useMetadataSections';

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

interface MetadataFieldProps {
  field: MetadataSectionField;
}

/**
 * Static class name to assign on metadata fields. This class name is used to
 * query the metadata fields so that we can check if the field is being clicked
 * on or not (see `usePreviewClickAway.ts`).
 */
export const PREVIEW_METADATA_FIELD_CLASS_NAME = 'preview-metadata-field';

function MetadataField({ field }: MetadataFieldProps) {
  const fieldBody = (
    <>
      <MetadataStatus hasValue={field.hasValue} />

      <span
        className={clsx(
          'text-sm ml-sds-l',
          !field.hasValue && 'font-semibold leading-[17.5px]',
        )}
      >
        {field.name}
      </span>
    </>
  );

  return (
    <li className="flex">
      {createElement(
        // Use buttons for missing fields so that the user can click to scroll to the missing field.
        field.hasValue ? 'span' : Button,
        {
          key: field.name,

          className: clsx(
            PREVIEW_METADATA_FIELD_CLASS_NAME,
            'flex items-start justify-start text-left m-0 p-sds-xxs flex-grow',
          ),

          // Attach click listener if field is a button.
          ...(field.hasValue
            ? {}
            : {
                onClick() {
                  previewStore.activeMetadataField = field.id;

                  // Scroll to the active metadata field.
                  const element = document.getElementById(field.id);
                  element?.scrollIntoView();

                  // Replace current URL hash with selected metadata ID.
                  setUrlHash(field.id);
                },
              }),
        },
        fieldBody,
      )}
    </li>
  );
}

interface Props {
  missingFieldsOnly?: boolean;
}

export function PreviewMetadataPanel({ missingFieldsOnly }: Props) {
  const sections = useMetadataSections();

  const renderSections = () => (
    <>
      {sections.map((section) => {
        if (missingFieldsOnly) {
          const hasMissingFields = section.fields.some(
            (field) => !field.hasValue,
          );

          if (!hasMissingFields) {
            return null;
          }
        }

        return (
          <section
            key={section.title}
            className={clsx(
              'space-y-sds-l relative',

              // Spacing for vertical list layout.
              'first:mt-0 mt-sds-xxl',

              // Add margin to last item for "masonry" layout.
              'screen-725:mt-0 screen-725:last:mt-12',

              // Remove margins for horizontal layout.
              'screen-875:last:mt-0',
            )}
          >
            <h2 className="font-semibold">{section.title}</h2>

            <p className={clsx('text-xs')}>{section.description}</p>

            <ul className="space-y-3">
              {getOrderedFields(section.fields)
                // Allow all fields if `missingFieldsOnly` is disabled, Otherwise, filter out values that have a value.
                .filter((field) => !missingFieldsOnly || !field.hasValue)
                .map((field) => (
                  <MetadataField
                    key={`${field.id}-${field.name}`}
                    field={field}
                  />
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
        'bg-hub-gray-100',

        // Horizontal padding
        'px-sds-xxl screen-495:px-12',

        // Vertical padding
        'py-sds-l screen-875:py-sds-xl',
      )}
    >
      <div
        className={clsx(
          'screen-875:hidden',
          'screen-725:grid screen-725:grid-cols-2 screen-725:gap-x-12',
        )}
      >
        {renderSections()}
      </div>

      <div className="hidden screen-875:grid grid-cols-napari-3 justify-center gap-12">
        <div
          className={clsx(
            'col-span-3',
            'grid grid-cols-[repeat(4,9.75rem)]',
            'justify-center gap-x-12',
          )}
        >
          {renderSections()}
        </div>
      </div>
    </div>
  );
}
