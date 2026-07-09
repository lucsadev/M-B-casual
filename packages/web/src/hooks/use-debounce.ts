/**
 * useDebounce — Debounce a value by a given delay.
 *
 * Returns a debounced version of the input value that only updates
 * after the specified delay has elapsed since the last change.
 *
 * @example
 * ```ts
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * // use debouncedSearch for API calls
 * ```
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
