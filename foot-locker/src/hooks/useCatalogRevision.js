import { useEffect, useState } from 'react';
import { subscribeCatalogChange } from '../utils/catalogStorage.js';

/** Bumps whenever staff saves catalog overlay (merged list refresh). */
export function useCatalogRevision() {
  const [n, setN] = useState(0);
  useEffect(
    () => subscribeCatalogChange(() => setN((x) => x + 1)),
    [],
  );
  return n;
}
