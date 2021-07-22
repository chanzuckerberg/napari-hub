import { useRouter } from 'next/router';

/**
 * Hook that gets the active URL parameter for a particular key. First it tries
 * getting the query parameter from the Next.js router. This will be populated
 * on initial server side rendering.
 *
 * If the query object is empty, check the URL for the query parameter. The
 * query object will only be empty for client side navigation:
 * https://github.com/vercel/next.js/issues/9473
 *
 * @param name The name of the query parameter
 * @returns Query parameter or empty string if undefined
 */
export function useActiveURLParameter<R extends string = string>(
  name: string,
): R | undefined {
  const router = useRouter();
  let value = router.query[name] as string | undefined;

  if (!value && process.browser) {
    const url = new URL(window.location.href);
    value = url.searchParams.get(name) ?? undefined;
  }

  if (value) {
    value = decodeURIComponent(value);
  }

  return value as R;
}
