import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import StylesProvider from '@material-ui/styles/StylesProvider';
import ThemeProvider from '@material-ui/styles/ThemeProvider';
import { defaultTheme } from 'czifui';
import NextPlausibleProvider from 'next-plausible';
import { ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Hydrate } from 'react-query/hydration';

import { MediaContextProvider } from '@/components/media';
import { PROD } from '@/env';
import { SearchStoreProvider } from '@/store/search/context';
import { theme } from '@/theme';

interface QueryProviderProps {
  children: ReactNode;
  dehydratedState: unknown;
}

/**
 * Provider that handles rehydrating the UI with server-side pre-fetched React
 * Query data:
 * https://react-query.tanstack.com/guides/ssr#using-hydration
 */
function ReactQueryProvider({ children, dehydratedState }: QueryProviderProps) {
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={dehydratedState}>
        {children}
        <ReactQueryDevtools />
      </Hydrate>
    </QueryClientProvider>
  );
}

interface ProviderProps {
  children: ReactNode;
}

/**
 * Provider for Material UI related features. This handles removing SSR styles
 * on the client and injects the theme object into the entire component tree.
 */
function MaterialUIProvider({ children }: ProviderProps) {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    jssStyles?.parentElement?.removeChild?.(jssStyles);
  }, []);

  return (
    <EmotionThemeProvider theme={defaultTheme}>
      <ThemeProvider theme={theme}>
        <StylesProvider
          // By default, Material UI will inject styles at the bottom of the
          // body so that it has higher priority over other CSS rules. This
          // makes it harder to override CSS, so we use `injectFirst` to
          // inject styles in the head element instead:
          // https://material-ui.com/styles/advanced/#injectfirst
          injectFirst
        >
          {children}
        </StylesProvider>
      </ThemeProvider>
    </EmotionThemeProvider>
  );
}

/**
 * Provider for Plausible functionality. This works by fetching the
 * `plausible.js` script via `next-plausible` and providing a typed
 * `plausible()` function in `hooks/usePlausible.ts`.
 *
 * By default, data will be sent to https://plausible.io/dev.napari-hub.org
 * dashboard. For production, data will be sent to
 * https://plausible.io/napari-hub.org.
 */
function PlausibleProvider({ children }: ProviderProps) {
  const isUsingPlausible = process.env.PLAUSIBLE === 'true';
  if (!isUsingPlausible) {
    return <>{children}</>;
  }

  // Plausible doesn't actually do any domain checking, so the domain is used
  // mostly an ID for which Plausible dashboard we want to send data to.
  // https://github.com/plausible/analytics/discussions/183
  const domain = PROD ? 'napari-hub.org' : 'dev.napari-hub.org';
  return (
    <NextPlausibleProvider domain={domain} enabled trackOutboundLinks>
      {children}
    </NextPlausibleProvider>
  );
}

interface ApplicationProviderProps extends ProviderProps {
  dehydratedState: unknown;
}

/**
 * Provider for setting up global store data that is shared for the entire
 * application. New global store provider should be added here so that all of
 * our store providers are in used in one location.
 */
function StoreProvider({ children }: ProviderProps) {
  return (
    // Render search store provider so that components using the search
    // store on non-search pages continue to function properly. Since it
    // is not possible to to run hooks conditionally, we can't get a
    // store snapshot conditionally, so we need to provide the store for every page.
    <SearchStoreProvider
      // Use `skipInit` to disable search effects for every page.
      skipInit
    >
      {children}
    </SearchStoreProvider>
  );
}

/**
 * Root application provider that composes all providers into one.
 */
export function ApplicationProvider({
  children,
  dehydratedState,
}: ApplicationProviderProps) {
  return (
    <ReactQueryProvider dehydratedState={dehydratedState}>
      <MediaContextProvider>
        <MaterialUIProvider>
          <PlausibleProvider>
            <StoreProvider>{children}</StoreProvider>
          </PlausibleProvider>
        </MaterialUIProvider>
      </MediaContextProvider>
    </ReactQueryProvider>
  );
}
