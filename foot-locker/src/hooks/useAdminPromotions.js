import { useCallback, useMemo, useState } from 'react';
import { promotionSeed } from '../data/adminMock.js';

/** @typedef {import('../data/adminMock.js').PromoRow} PromoRow */

/** @typedef {{ custom: PromoRow[], disabledSeedIds: string[] }} PromoStore */
/** @type {PromoStore} */
let memoryStore = { custom: [], disabledSeedIds: [] };

function readStore() {
  return memoryStore;
}

function slugId(code) {
  return `cust-${code.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${Date.now().toString(36)}`;
}

export function useAdminPromotions() {
  const [store, setStore] = useState(() => readStore());

  const persist = useCallback((next) => {
    memoryStore = next;
    setStore(next);
  }, []);

  const allRowsForAdmin = useMemo(() => {
    const seedRows = promotionSeed.map((p) => ({
      ...p,
      active: !store.disabledSeedIds.includes(p.id),
      isSeed: true,
    }));
    return [...seedRows, ...store.custom.map((p) => ({ ...p, isSeed: false }))];
  }, [store]);

  const addPromo = useCallback(
    (/** @type {Omit<PromoRow,'id'>} */ draft) => {
      const row = { ...draft, id: slugId(draft.code) };
      persist({ ...store, custom: [...store.custom, row] });
    },
    [store, persist],
  );

  const togglePromoActive = useCallback(
    (id, isSeed) => {
      if (isSeed) {
        const has = store.disabledSeedIds.includes(id);
        const disabledSeedIds = has
          ? store.disabledSeedIds.filter((x) => x !== id)
          : [...store.disabledSeedIds, id];
        persist({ ...store, disabledSeedIds });
        return;
      }
      const custom = store.custom.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      );
      persist({ ...store, custom });
    },
    [store, persist],
  );

  const removeCustom = useCallback(
    (id) => {
      persist({ ...store, custom: store.custom.filter((p) => p.id !== id) });
    },
    [store, persist],
  );

  return { allRowsForAdmin, addPromo, togglePromoActive, removeCustom };
}
