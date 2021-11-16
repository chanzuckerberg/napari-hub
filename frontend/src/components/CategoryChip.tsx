import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import clsx from 'clsx';
import { Chip, Tooltip } from 'czifui';
import { Fragment } from 'react';
import { DeepPartial } from 'utility-types';

import { FilterCategoryKeys, searchFormStore } from '@/store/search/form.store';
import { HubDimension } from '@/types';

import { Link } from './common/Link';

interface Props {
  dimension: HubDimension;
  category?: string;
  categoryHierarchy?: string[];
}

// TODO Replace with actual copy for tooltips.
const EXAMPLE_TEXT =
  "According to all known laws of aviation, there is no way that a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyways. Because bees don't care what humans think is impossible.";

const TOOLTIP_TEXT: DeepPartial<Record<HubDimension, Record<string, string>>> =
  {
    'Workflow step': {
      'Image Segmentation': EXAMPLE_TEXT,
      'Image annotation': EXAMPLE_TEXT,
    },
  };

const STATE_KEY_MAP: Partial<Record<HubDimension, FilterCategoryKeys>> = {
  'Image modality': 'imageModality',
  'Workflow step': 'workflowStep',
};

/**
 * Component for rendering a category or category hierarchy within a Chip / Pill
 * component. This also renders a tooltip with information about the category if
 * copy is available.
 */
export function CategoryChip({
  dimension,
  category,
  categoryHierarchy,
}: Props) {
  const chipBody =
    category ||
    categoryHierarchy?.map((term, index) => (
      <Fragment key={`${dimension}-${term}`}>
        {index === 0 ? (
          <Link className="underline" href={`/?workflowStep=${term}`}>
            {term}
          </Link>
        ) : (
          <span>{term}</span>
        )}

        <span>{index < categoryHierarchy.length - 1 && '›'}</span>
      </Fragment>
    ));

  const tooltipTitle = category || categoryHierarchy?.[0];
  const tooltipBody = tooltipTitle && TOOLTIP_TEXT?.[dimension]?.[tooltipTitle];

  return (
    <>
      <Chip
        className="bg-napari-category-blue text-xs hover:bg-napari-hover focus:bg-napari-hover"
        classes={{
          label: 'pl-2 pr-0',
        }}
        onClick={(event) => {
          event.preventDefault();

          const stateKey = STATE_KEY_MAP[dimension];
          if (tooltipTitle && stateKey) {
            searchFormStore.filters[stateKey][tooltipTitle] = true;
          }
        }}
        label={
          <div className="flex items-center space-x-1">
            <span>{dimension}</span>
            <span className="font-semibold space-x-1">{chipBody}</span>

            {tooltipTitle && tooltipBody && (
              // TODO Replace with hub specific tooltip implementation.
              <Tooltip
                leaveDelay={0}
                classes={{
                  tooltip: 'border border-napari-gray',
                }}
                title={
                  <div
                    className={clsx(
                      'leading-normal',
                      'flex flex-col',
                      'mx-3 my-2 space-y-2',
                    )}
                  >
                    <span className="font-semibold text-sm">
                      {tooltipTitle}
                    </span>
                    <span className="text-xs">{tooltipBody}</span>
                    <span className="text-xs italic">
                      Click the category name to add it as a filter.
                    </span>
                  </div>
                }
              >
                <span className="p-2 pr-3 flex items-center justify-center">
                  <InfoOutlinedIcon className="w-3 h-3" />
                </span>
              </Tooltip>
            )}
          </div>
        }
      />
    </>
  );
}
