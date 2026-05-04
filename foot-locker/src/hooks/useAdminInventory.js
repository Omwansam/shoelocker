import { useContext } from 'react';
import { AdminOpsContext } from '../context/adminOpsContext.js';

export function useAdminInventory() {
  const ctx = useContext(AdminOpsContext);
  if (!ctx) throw new Error('useAdminInventory requires AdminOpsProvider');
  const { inventoryMap, getStock, setStock, lowStockProducts } = ctx;
  return { getStock, setStock, map: inventoryMap, lowStockProducts };
}
