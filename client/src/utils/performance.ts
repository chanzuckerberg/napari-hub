interface MeasureExecutionResult {
  duration: string;
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
  const now = window.performance.now();
  const result = fn();
  const end = window.performance.now();
  const duration = `${(end - now).toFixed(2)} ms`;

  return {
    duration,
    result,
  };
}
