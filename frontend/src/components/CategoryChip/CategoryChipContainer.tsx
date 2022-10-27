import clsx from 'clsx';
import { isString, set } from 'lodash';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';

import { PlausibleEventKey, usePlausible } from '@/hooks';
import { useSearchStore } from '@/store/search/context';
import { HubDimension } from '@/types';
import { createUrl } from '@/utils';

import { CategoryChip } from './CategoryChip';
import { STATE_KEY_MAP } from './constants';

interface Props {
  dimension: HubDimension;
  categories?: string[];
  hierarchies?: string[][];
  containerRef: RefObject<HTMLElement>;
  pluginName: string;
  setIsHovering?(value: boolean): void;
}

/**
 * Minimum amount of buffer space required between the last visible pill and the
 * parent container before the pills are collapsed. The space is used to render
 * the `Show <count> more` button when collapsed.
 */
const OVERFLOW_BUTTON_BUFFER_PX = 300;

export function CategoryChipContainer({
  dimension,
  categories,
  hierarchies = [],
  containerRef,
  pluginName,
  setIsHovering,
}: Props) {
  const categoryChipsRef = useRef<HTMLDivElement[]>([]);
  const [overflowIndex, setOverflowIndex] = useState(Infinity);
  const [overrideOverflow, setOverrideOverflow] = useState(false);
  const { t } = useTranslation(['homePage']);
  const plausible = usePlausible();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const containerRight =
      containerRef.current.offsetWidth + containerRef.current.offsetLeft;

    for (let i = 0; i < categoryChipsRef.current.length; i += 1) {
      const node = categoryChipsRef.current[i];
      const nodeRight = node.offsetLeft + node.offsetWidth;
      if (nodeRight > containerRight) {
        if (nodeRight - containerRight < OVERFLOW_BUTTON_BUFFER_PX) {
          setOverflowIndex(i - 1);
        } else {
          setOverflowIndex(i);
        }

        break;
      }
    }
  }, [containerRef]);

  const { searchStore } = useSearchStore();
  const snap = useSnapshot(searchStore);
  const router = useRouter();

  const activeMap = useMemo(() => {
    const stateKey = STATE_KEY_MAP[dimension];

    if (!stateKey) return {};
    if (router.pathname === '/') return snap.filters[stateKey];

    const result: Record<string, boolean | undefined> = {};
    const params = createUrl(router.asPath).searchParams;
    params.getAll(stateKey).forEach((key) => set(result, key, true));

    return result;
  }, [dimension, router.asPath, router.pathname, snap.filters]);

  const categoryNodes = (
    categories ? Array.from(categories) : Array.from(hierarchies)
  )
    .sort((item1, item2) => {
      const category1 = isString(item1) ? item1 : item1[0];
      const category2 = isString(item2) ? item2 : item2[0];

      if (activeMap[category1] && !activeMap[category2]) {
        return -1;
      }

      if (!activeMap[category1] && activeMap[category2]) {
        return 1;
      }

      return 0;
    })
    .map((value, index) => (
      <CategoryChip
        className={clsx(
          index >= overflowIndex && !overrideOverflow && '!hidden',
        )}
        isActive={activeMap[categories ? (value as string) : value[0]]}
        ref={(element) => set(categoryChipsRef.current, index, element)}
        key={`${dimension}-${JSON.stringify(value)}`}
        dimension={dimension}
        category={categories ? (value as string) : undefined}
        categoryHierarchy={!categories ? (value as string[]) : undefined}
        onMouseEnter={() => setIsHovering?.(true)}
        onMouseLeave={() => setIsHovering?.(false)}
      />
    ));

  return (
    <div className="flex gap-sds-s flex-wrap items-center">
      <span className="font-semibold text-xs whitespace-nowrap inline">
        {dimension}:
      </span>

      <div
        className={clsx(
          'inline-flex gap-sds-s max-w-full',
          overrideOverflow && 'flex-wrap',
        )}
      >
        {categoryNodes}
      </div>

      {overflowIndex !== Infinity && (
        <button
          className="underline hover:bg-hub-gray-100 p-sds-xxs"
          onClick={(event) => {
            event.preventDefault();
            setOverrideOverflow((state) => {
              const plausibleEvent: PlausibleEventKey = state
                ? 'Collapse Category'
                : 'Expand Category';

              plausible(plausibleEvent, {
                categoryDimension: dimension,
                plugin: pluginName,
                url: router.pathname,
              });

              return !state;
            });
          }}
          onMouseEnter={() => setIsHovering?.(true)}
          onMouseLeave={() => setIsHovering?.(false)}
          type="button"
        >
          {overrideOverflow
            ? t('homePage:collapse')
            : t('homePage:showMore', {
                count: (categories || hierarchies).length - overflowIndex,
              })}
        </button>
      )}
    </div>
  );
}
