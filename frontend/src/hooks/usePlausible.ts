import { usePlausible as usePlausibleNext } from 'next-plausible';

import { Logger } from '@/utils';

const logger = new Logger('usePlausible.ts');

/**
 * Payloads for each event type. A type alias is used instead of an interface
 * because type aliases have an implicit index signature: https://git.io/JZt9O
 */
export type Events = {
  'Copy Package': {
    plugin: string;
  };

  'Description Nav': {
    plugin: string;
    section: string;
  };

  Filter: {
    field: string;
    value: string;
    checked: boolean;
  };

  Install: {
    plugin: string;
  };

  Links: {
    plugin: string;
    link: string;
    url: string;
    host: string;
  };

  Search: never;

  Signup: never;

  Sort: {
    by: string;
  };

  'Collapse Category': {
    plugin: string;
    url: string;
    categoryDimension: string;
  };

  'Expand Category': {
    plugin: string;
    url: string;
    categoryDimension: string;
  };

  'CTA: New Collection': unknown;
};

export type PlausibleEventKey = keyof Events;

/**
 * Hook for sending custom Plausible events with typing enabled.
 */
export function usePlausible() {
  const plausible = usePlausibleNext();

  function sendEvent<E extends PlausibleEventKey>(
    event: E,
    ...payload: Events[E][]
  ) {
    logger.debug('Plausible event:', { event, payload });

    plausible(event, {
      props: payload[0],
    });
  }

  return sendEvent;
}
