import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { Chip, Tooltip } from 'czifui';
import { Fragment } from 'react';
import { DeepPartial } from 'utility-types';

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

export const TOOLTIP_TEXT: DeepPartial<
  Record<HubDimension, Record<string, string>>
> = {
  'Workflow step': {
    'Image Segmentation': EXAMPLE_TEXT,
    'Image annotation': EXAMPLE_TEXT,
  },
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
        className="bg-[#ecf8ff] text-xs"
        label={
          <div className="flex items-center space-x-1">
            <span>{dimension}</span>
            <span className="font-semibold space-x-1">{chipBody}</span>

            {tooltipTitle && tooltipBody && (
              // TODO Replace with hub specific tooltip implementation.
              <Tooltip
                arrow
                title={
                  <div className="flex flex-col mx-3 my-2 space-y-2 leading-normal">
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
                <InfoOutlinedIcon className="w-3 h-3" />
              </Tooltip>
            )}
          </div>
        }
      />
    </>
  );
}
