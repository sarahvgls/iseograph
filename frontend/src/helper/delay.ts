import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a tuple of `[schedule, cancel]` functions that activate/deactivate a
 * timer delay to trigger the `callback` function.
 *
 * @param callback The callback.
 * @param delay The duration of the delay in milliseconds.
 */
export const useDelay = (
  callback: () => void,
  delay: number,
): [() => void, () => void] => {
  // @ts-expect-error TODO
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const cancel = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      // @ts-expect-error TODO
      timerRef.current = undefined;
    }
  }, []);

  const schedule = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  useEffect(
    () => () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
        // @ts-expect-error TODO
        timerRef.current = undefined;
      }
    },
    [],
  );

  return [schedule, cancel];
};
