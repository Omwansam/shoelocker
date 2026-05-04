import { useContext } from 'react';
import { AdminOpsContext } from '../context/adminOpsContext.js';

/** @typedef {import('../data/adminMock.js').OrderStatus} OrderStatus */

/**
 * @param {{ id: string, status: OrderStatus }} order
 * @param {Record<string, OrderStatus>} patches
 */
export function getEffectiveOrderStatus(order, patches) {
  const p = patches[order.id];
  return p ?? order.status;
}

export function useAdminOrderStatuses() {
  const ctx = useContext(AdminOpsContext);
  if (!ctx) throw new Error('useAdminOrderStatuses requires AdminOpsProvider');
  const { orderPatches, setOrderStatus, getOrderStatus } = ctx;
  return {
    patches: orderPatches,
    setStatus: setOrderStatus,
    getStatus: getOrderStatus,
  };
}
