import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Chip, { ChipProps } from '@mui/material/Chip';
import clsx from 'clsx';
import { useTranslation } from 'next-i18next';
import {
  ForwardedRef,
  forwardRef,
  Fragment,
  ReactNode,
  useRef,
  useState,
} from 'react';

import { Link } from '@/components/Link';
import { Tooltip } from '@/components/Tooltip';
import { useIsTapDevice } from '@/hooks/useIsTapDevice';
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
  const iconRef = useRef<HTMLDivElement>(null);
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
              {
                t(
                  `pluginData:category.labels.${term}` as I18nKeys<'common'>,
                ) as ReactNode
              }
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

  const isTapDevice = useIsTapDevice();

  function renderTooltip(node: ReactNode) {
    return (
      <Tooltip
        disableInteractive={false}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
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
              'mx-sds-l my-sds-s space-y-sds-s',
            )}
          >
            <span className="font-semibold text-sm">{categoryType}</span>
            <span className="text-xs">{tooltipBody as ReactNode}</span>
            <span className="text-xs italic">
              {t('pluginData:category.clickToAdd')}
            </span>
          </div>
        }
      >
        <div>{node}</div>
      </Tooltip>
    );
  }

  const icon = (
    <div ref={iconRef}>
      <button
        className="pr-[12px] flex items-center justify-center"
        onClick={(event) => {
          // Open tooltip when clicking on tooltip info button.
          event.preventDefault();
          setOpen(true);
        }}
        type="button"
        aria-label={`info-${category ?? ''}`}
      >
        <InfoOutlinedIcon className="w-3 h-3" />
      </button>
    </div>
  );

  const chip = (
    <Chip
      ref={ref}
      className={clsx(
        'text-xs !rounded-sds-l',
        className,

        isActive && [
          'bg-hub-primary-200',
          'hover:bg-hub-primary-300',
          'focus:bg-hub-primary-300',
        ],

        !isActive && [
          'bg-hub-gray-100',
          'hover:bg-hub-gray-100',
          'focus:bg-hub-gray-100',
        ],
      )}
      classes={{
        label: clsx('pl-[12px]', hasTooltip && 'pr-0'),
      }}
      onClick={(event) => {
        event.preventDefault();

        const stateKey = STATE_KEY_MAP[dimension];
        if (categoryType && stateKey) {
          searchStore.filters[stateKey][categoryType] = true;
        }
      }}
      label={
        <div className="flex items-center space-x-sds-xxs">
          <span className="font-semibold space-x-sds-xxs">
            {chipBody as ReactNode}
          </span>
          {isTapDevice ? icon : renderTooltip(icon)}
        </div>
      }
      {...props}
    />
  );

  return (
    <div className={className}>
      {!hasTooltip || !isTapDevice ? chip : renderTooltip(chip)}
    </div>
  );
}

export const CategoryChip = forwardRef<HTMLDivElement, Props>(BaseCategoryChip);
