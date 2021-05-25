import { ReactNode } from 'react-markdown';
import { QueryParamProvider } from 'use-query-params';

import { useHistory, useLocation } from './urlParameters.hooks';

/**
 * Extract interface from component because it doesn't export it for some reason.
 */
type QueryParamProviderProps = Pick<
  Parameters<typeof QueryParamProvider>[0],
  'history' | 'location'
>;

interface Props extends QueryParamProviderProps {
  children: ReactNode;
}

/**
 * Provider for global URL parameter state. The state is sync'd with query
 * parameters, so updating the state will also update the URL.
 *
 * This version provides its own history and location objects that are
 * compatible with the Next.js router and the browser router so that URL
 * parameters can be handled universally.
 *
 * Reference:
 * https://github.com/pbeshai/use-query-params/issues/13#issuecomment-815577849
 */
export function URLParameterStateProvider({ children, ...props }: Props) {
  const location = useLocation();
  const history = useHistory();

  return (
    <QueryParamProvider {...props} history={history} location={location}>
      {children}
    </QueryParamProvider>
  );
}
