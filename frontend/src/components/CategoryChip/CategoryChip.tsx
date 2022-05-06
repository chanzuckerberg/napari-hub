import Chip, { ChipProps } from '@material-ui/core/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import { ForwardedRef, forwardRef, Fragment, useRef, useState } from 'react';

import { Link } from '@/components/Link';
import { useSearchStore } from '@/store/search/context';
import { HubDimension } from '@/types';
import { I18nKeys } from '@/types/i18n';

import { STATE_KEY_MAP } from './constants';

export interface Props extends ChipProps {
  category?: string;
  categoryHierarchy?: string[];
  dimension: HubDimension;
  isActive?: boolean;
}

/**
 * Component for rendering a category or category hierarchy within a Chip / Pill
 * component. This also renders a tooltip with information about the category if
 * copy is available.
 */
function BaseCategoryChip(
  {
    className,
    category,
    categoryHierarchy,
    dimension,
    isActive,
    ...props
  }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [t] = useTranslation(['common', 'pluginData']);
  const { searchStore } = useSearchStore();
  const iconRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const chipBody = category
    ? t(`pluginData:category.labels.${category}` as I18nKeys<'common'>)
    : categoryHierarchy?.map((term, index) => (
        <Fragment key={`${dimension}-${term}`}>
          {index === 0 ? (
            <Link
              className="underline"
              href={`/?${STATE_KEY_MAP[dimension] ?? ''}=${term}`}
            >
              {t(`pluginData:category.labels.${term}` as I18nKeys<'common'>)}
            </Link>
          ) : (
            <span>{term}</span>
          )}

          <span>{index < categoryHierarchy.length - 1 && '›'}</span>
        </Fragment>
      ));

  const categoryType = category || categoryHierarchy?.[0];
  const tooltipBody =
    categoryType &&
    t(`pluginData:category.tooltips.${categoryType}` as I18nKeys<'common'>);
  const hasTooltip = !!(categoryType && tooltipBody);

  return (
    <Chip
      ref={ref}
      className={clsx(
        'text-xs !rounded-full',
        className,

        isActive && [
          'bg-napari-category-blue',
          'hover:bg-napari-light',
          'focus:bg-napari-light',
        ],

        !isActive && [
          'bg-napari-hover-gray',
          'hover:bg-napari-hover-gray',
          'focus:bg-napari-hover-gray',
        ],
      )}
      classes={{
        label: clsx('pl-2', hasTooltip && 'pr-0'),
      }}
      onClick={(event) => {
        event.preventDefault();

        const stateKey = STATE_KEY_MAP[dimension];
        if (categoryType && stateKey) {
          searchStore.filters[stateKey][categoryType] = true;
        }
      }}
      label={
        <div className="flex items-center space-x-1">
          <span className="font-semibold space-x-1">{chipBody}</span>
          {hasTooltip && (
            <Tooltip
              arrow
              open={open}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              leaveDelay={0}
              classes={{
                arrow:
                  'before:bg-white before:border before:border-napari-gray',
                tooltip: 'bg-white text-black border border-napari-gray',
              }}
              PopperProps={{
                anchorEl() {
                  return iconRef.current as HTMLButtonElement;
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
                  <span className="font-semibold text-sm">{categoryType}</span>
                  <span className="text-xs">{tooltipBody}</span>
                  <span className="text-xs italic">
                    {t('pluginData:category.clickToAdd')}
                  </span>
                </div>
              }
            >
              <button
                className="p-2 pr-3 flex items-center justify-center"
                ref={iconRef}
                onClick={(event) => {
                  // Open tooltip when clicking on tooltip info button.
                  event.preventDefault();
                  setOpen(true);
                }}
                type="button"
              >
                <InfoOutlinedIcon className="w-3 h-3" />
              </button>
            </Tooltip>
          )}
        </div>
      }
      {...props}
    />
  );
}

export const CategoryChip = forwardRef<HTMLDivElement, Props>(BaseCategoryChip);
