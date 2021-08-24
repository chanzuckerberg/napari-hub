import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { setSkeletonResultCount } from '@/utils';
import { Logger } from '@/utils/logger';
import { measureExecution } from '@/utils/performance';

import { SKELETON_RESULT_COUNT_BUFFER } from './constants';
import { FuseSearchEngine } from './engines';
import { searchResultsState } from './results.state';
import { pluginIndexState, searchEngineState } from './search.state';
import { SearchEngine } from './search.types';

const logger = new Logger('search.hooks.ts');

function getDefaultSearchEngine() {
  return new FuseSearchEngine();
}

/**
 * Hook that runs effects that depend on search state.
 */
function useSearchEffects() {
  const [results] = useAtom(searchResultsState);

  useEffect(() => {
    setSkeletonResultCount(results.length + SKELETON_RESULT_COUNT_BUFFER);
  }, [results]);
}

/**
 * Hook that creates the search engine instance for a given plugin index.
 *
 * @param getSearchEngine Function for creating a search engine.
 */
export function useSearchEngine(
  getSearchEngine: () => SearchEngine = getDefaultSearchEngine,
) {
  const [index] = useAtom(pluginIndexState);
  const [, setEngine] = useAtom(searchEngineState);

  useSearchEffects();

  // Create new search engine whenever the index changes.
  useEffect(() => {
    const searchEngine = getSearchEngine();

    const { duration } = measureExecution(() => searchEngine.index(index));
    logger.debug('search index duration:', duration);

    setEngine(searchEngine);
  }, [getSearchEngine, index, setEngine]);
}
