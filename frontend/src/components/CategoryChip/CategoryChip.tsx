import Chip from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import clsx from 'clsx';
import { Fragment, useRef } from 'react';

import { Link } from '@/components/common/Link';
import { useSearchStore } from '@/store/search/context';
import { FilterCategoryKeys } from '@/store/search/search.store';
import { HubDimension } from '@/types';

import { TOOLTIP_TEXT } from './constants';

interface Props {
  dimension: HubDimension;
  category?: string;
  categoryHierarchy?: string[];
}

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
  const { searchStore } = useSearchStore();
  const iconRef = useRef<HTMLDivElement>(null);
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
  const hasTooltip = !!(tooltipTitle && tooltipBody);

  const tooltipBodyNode = (
    <Chip
      className={clsx(
        'text-xs !rounded-full',
        'bg-napari-category-blue hover:bg-napari-hover focus:bg-napari-hover',
      )}
      classes={{
        label: clsx('pl-2', hasTooltip && 'pr-0'),
      }}
      onClick={(event) => {
        event.preventDefault();

        const stateKey = STATE_KEY_MAP[dimension];
        if (tooltipTitle && stateKey) {
          searchStore.filters[stateKey][tooltipTitle] = true;
        }
      }}
      label={
        <div className="flex items-center space-x-1">
          <span>{dimension}</span>
          <span className="font-semibold space-x-1">{chipBody}</span>
          <span
            className="p-2 pr-3 flex items-center justify-center"
            ref={iconRef}
          >
            <InfoOutlinedIcon className="w-3 h-3" />
          </span>
        </div>
      }
    />
  );

  return (
    <Tooltip
      arrow
      leaveDelay={0}
      classes={{
        arrow: 'before:bg-white before:border before:border-napari-gray',
        tooltip: 'bg-white text-black border border-napari-gray',
      }}
      PopperProps={{
        anchorEl() {
          return iconRef.current as HTMLDivElement;
        },
      }}
      title={
        <div
          className={clsx(
            'leading-normal',
            'flex flex-col',
            'mx-3 my-2 space-y-2',
          )}
        >
          <span className="font-semibold text-sm">{tooltipTitle}</span>
          <span className="text-xs">{tooltipBody}</span>
          <span className="text-xs italic">
            Click the category name to add it as a filter.
          </span>
        </div>
      }
    >
      {tooltipBodyNode}
    </Tooltip>
  );
}
