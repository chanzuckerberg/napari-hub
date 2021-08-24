import { atom, WritableAtom } from 'jotai';
import { atomWithReset, RESET } from 'jotai/utils';
import Router from 'next/router';

interface AtomWithQueryParameterOptions {
  /**
   * Name of the query parameter.
   */
  paramName: string;

  /**
   * Value to use for the query parameter. This should only be used for boolean
   * states that have a predefined value.
   *
   * If a `paramValue` is specified, multiple parameters with the same name but
   * different values can be appended to the URL. If it isn't define, then there
   * can only be one parameter since the value can vary.
   */
  paramValue?: string;

  /**
   * Serializes a value into a string for storing in the URL.
   *
   * @param value The value to serialize.
   */
  serializer?<Value>(value: Value): string;

  /**
   * Deserializes a string into a typed value.
   *
   * @param value The value to deserialize
   */
  deserializer?<Value>(value: string): Value;
}

function defaultSerializer<Value>(value: Value) {
  return String(value);
}

function defaultDeserializer<Value = string>(value: string) {
  return (value as unknown) as Value;
}

/**
 * Action object used to represent making a modification to a query parameter.
 * Parameters can be appended, set, or removed. If a value is specified, then
 * the parameter will only be removed if it has the matching value. Otherwise,
 * all parameters with the same name will be removed.
 */
interface QueryParameterAction {
  type: 'append' | 'set' | 'remove';
  name: string;
  value?: string;
}

/**
 * Duration to wait before writing to the URL. The time window is to prevent
 * race conditions with multiple atoms trying to write to the URL all at once.
 */
const REPLACE_STATE_TIME_WINDOW_MS = 100;

/**
 * ID used for setting / clearing the timeout when writing the query parameters
 * to the URL.
 */
let writeParametersToUrlTimeoutId = 0;

const pendingParameterActions: QueryParameterAction[] = [];

/**
 * Schedules a query paramter action for execution.  This works by using
 * `setTimeout()` to schedule execution after a certain time window. If another
 * action is created before completion of that timeout, it's appended to the
 * pending list of actions so that they can be processed together.
 *
 * @param action The query parameter action.
 */
function scheduleQueryParameterAction(action: QueryParameterAction) {
  if (writeParametersToUrlTimeoutId) {
    window.clearTimeout(writeParametersToUrlTimeoutId);
    writeParametersToUrlTimeoutId = 0;
  }

  pendingParameterActions.push(action);

  writeParametersToUrlTimeoutId = window.setTimeout(() => {
    const url = new URL(Router.asPath, window.location.origin);

    while (pendingParameterActions.length > 0) {
      const nextAction = pendingParameterActions.pop();
      if (!nextAction) {
        break;
      }

      const { type, name, value } = nextAction;

      if (type === 'append' && value) {
        url.searchParams.append(name, value);
      } else if (type === 'remove') {
        const values = url.searchParams
          .getAll(name)
          .filter((currentValue) => currentValue !== value);

        url.searchParams.delete(name);

        // Append remaining values if they exist.
        for (const currentValue of values) {
          url.searchParams.append(name, currentValue);
        }
      } else if (type === 'set' && value) {
        url.searchParams.set(name, value);
      }
    }

    const nextUrl = { search: url.search };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Router.replace(nextUrl, nextUrl, { shallow: true });

    writeParametersToUrlTimeoutId = 0;
  }, REPLACE_STATE_TIME_WINDOW_MS);
}

/**
 * Atom creator for creating state that is sync'd with a query parameter.
 * However, the state is completely sync'd. The query parameter is always
 * written to when the state is changed, but the only time we read the query
 * parameter is on initial load. This is fine as long as we don't modify the URL
 * parameters outside of this state creator.
 *
 * @param initialValue The initial value for the state.
 * @param options Configuration for the query parameter.
 * @returns Atom state.
 */
export function atomWithQueryParameter<Value>(
  initialValue: Value,
  options: AtomWithQueryParameterOptions,
): WritableAtom<Value, Value | typeof RESET> {
  const {
    paramName,
    paramValue,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
  } = options;

  // State for holding value.
  const state = atomWithReset(initialValue);

  // Initialize state with query parameter values on initial load.
  state.onMount = (setState) => {
    const url = new URL(window.location.href);

    if (paramValue) {
      if (url.searchParams.getAll(paramName).includes(paramValue)) {
        // If `paramValue` is defined, assume the state is a boolean. In
        // practice, we should only define `paramValue` for boolean states.
        const value = true as unknown;
        setState(value as Value);
      }
    } else {
      const value = url.searchParams.get(paramName);
      if (value) {
        setState(deserializer(value));
      }
    }
  };

  // Derived state that handles setting the query parameter when the state is updated.
  const stateWithParam = atom(
    (get) => get(state),
    (_, set, nextValue: Value | typeof RESET) => {
      set(state, nextValue);

      const action: Partial<QueryParameterAction> = {
        name: paramName,
        value: paramValue,
      };

      // Remove query parameter if the next value is falsy or if the state is
      // being reset using `useResetAtom()`.
      if (!nextValue || nextValue === RESET) {
        action.type = 'remove';
      } else if (paramValue) {
        action.type = 'append';
      } else {
        action.type = 'set';
        action.value = serializer(nextValue);
      }

      scheduleQueryParameterAction(action as QueryParameterAction);
    },
  );

  return stateWithParam;
}
