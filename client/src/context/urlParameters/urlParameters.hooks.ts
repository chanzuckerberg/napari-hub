import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { PushReplaceHistory } from 'use-query-params';

/**
 * Hook that returns the location object. On the browser, the default location
 * is returned. But on the server, we need to pass our own version to be
 * compatible with the Next.js router.
 *
 * @returns The location object
 */
export function useLocation(): Location {
  const router = useRouter();
  const location = useMemo(() => {
    if (process.browser) {
      return window.location;
    }

    return {
      search: router.asPath.replace(/[^?]+/u, ''),
    } as Location;
  }, [router]);

  return location;
}

/**
 * Hook that returns the history object for navigation. This returns a version
 * that calls the Next.js router APIs directly instead of the browser APIs.
 * Since the Next.js router is universal, history interactions using this hook
 * should also be universal.
 *
 * @returns The history object
 */
export function useHistory(): PushReplaceHistory {
  const router = useRouter();
  const match = /[^?]+/.exec(router.asPath);
  const pathname = match ? match[0] : router.asPath;
  const location = useLocation();

  const history = useMemo(
    () => ({
      push: ({ search }: Location) =>
        router.push(
          { pathname: router.pathname, query: router.query },
          { search, pathname },
          { shallow: true },
        ),

      replace: async ({ search }: Location) => {
        await router.replace(
          { pathname: router.pathname, query: router.query },
          { search, pathname },
          { shallow: true },
        );
      },
      location,
    }),
    [location, pathname, router],
  );

  return history;
}
