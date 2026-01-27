import { useUnmount } from '@/hooks/use-unmount';
import { throttle, ThrottleOptions } from 'es-toolkit';
import { useMemo, useRef } from 'react';

const defaultOptions: ThrottleOptions = {
  edges: ['leading', 'trailing']
};

/**
 * A hook that returns a throttled callback function.
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  wait = 250,
  dependencies: React.DependencyList = [],
  options: ThrottleOptions = defaultOptions
) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const handler = useMemo(
    () => throttle<T>(((...args: Parameters<T>) => fnRef.current(...args)) as T, wait, options),
    dependencies
  );

  useUnmount(() => {
    handler.cancel();
  });

  return handler;
}

export default useThrottledCallback;
