import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  mergeCatalogList,
  subscribeCatalogChange,
} from '../utils/catalogStorage.js';
import { AdminOpsContext } from './adminOpsContext.js';

/** @typedef {import('../data/adminMock.js').OrderStatus} OrderStatus */

function defaultStock(/** @type {string} */ productId) {
  return 12 + (productId.charCodeAt(0) % 18) * 3;
}

function readOrderPatches() {
  return {};
}

function readInventoryMap() {
  return {};
}

/** @param {{ children: import('react').ReactNode }} props */
export function AdminOpsProvider({ children }) {
  const [orderPatches, setOrderPatches] = useState(() => readOrderPatches());
  const [inventoryMap, setInventoryMap] = useState(() => readInventoryMap());
  const [catalogRev, setCatalogRev] = useState(0);

  useEffect(
    () => subscribeCatalogChange(() => setCatalogRev((n) => n + 1)),
    [],
  );

  const setOrderStatus = useCallback((orderId, status) => {
    setOrderPatches((prev) => {
      const next = { ...prev, [orderId]: status };
      return next;
    });
  }, []);

  const getOrderStatus = useCallback(
    (/** @type {{ id: string, status: OrderStatus }} */ order) =>
      orderPatches[order.id] ?? order.status,
    [orderPatches],
  );

  const setStock = useCallback((productId, qty) => {
    const n = Math.max(0, Math.floor(Number(qty) || 0));
    setInventoryMap((prev) => {
      const next = { ...prev, [productId]: n };
      return next;
    });
  }, []);

  const getStock = useCallback(
    (productId) => {
      const v = inventoryMap[productId];
      return typeof v === 'number' ? v : defaultStock(productId);
    },
    [inventoryMap],
  );

  const mergedCatalog = useMemo(() => {
    void catalogRev;
    return mergeCatalogList();
  }, [catalogRev]);

  const lowStockProducts = useMemo(
    () => mergedCatalog.filter((p) => getStock(p.id) < 8),
    [mergedCatalog, getStock],
  );

  const value = useMemo(
    () => ({
      orderPatches,
      setOrderStatus,
      getOrderStatus,
      inventoryMap,
      setStock,
      getStock,
      lowStockProducts,
    }),
    [
      orderPatches,
      setOrderStatus,
      getOrderStatus,
      inventoryMap,
      setStock,
      getStock,
      lowStockProducts,
    ],
  );

  return (
    <AdminOpsContext.Provider value={value}>{children}</AdminOpsContext.Provider>
  );
}
