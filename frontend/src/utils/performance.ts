import { isNumber } from 'lodash';

interface MeasureExecutionResult {
  duration: string;
}

/**
 * Returns high performance time in milliseconds since last the last call to
 * performanceNow`. This function is universal by using the browser Performance
 * API on the client and `process.hrtime` on the server.
 *
 * TODO Refactor to use `perf_hooks` when available in Next.js:
 * https://github.com/vercel/next.js/issues/4844
 *
 * @returns The current time in milliseconds.
 */
function performanceNow() {
  if (process.browser) {
    return window.performance.now();
  }

  return process.hrtime.bigint();
}

/**
 * Utility for measuring the execution duration of a function.
 *
 * @param fn Function to measure.
 * @returns The result of the function, if any.
 */
export function measureExecution<R>(
  fn: () => R,
): MeasureExecutionResult & { result: R } {
  const now = performanceNow();
  const result = fn();
  const end = performanceNow();
  let duration = '';

  if (isNumber(now) && isNumber(end)) {
    duration = `${(end - now).toFixed(2)} ms`;
  } else if (typeof now === 'bigint' && typeof end === 'bigint') {
    duration = `${end - now} ms`;
  }

  return {
    duration,
    result,
  };
}
