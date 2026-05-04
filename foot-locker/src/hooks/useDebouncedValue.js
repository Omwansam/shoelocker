import { useEffect, useState } from 'react';

/**
 * @template T
 * @param {T} value
 * @param {number} delayMs
 */
export function useDebouncedValue(value, delayMs = 280) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
