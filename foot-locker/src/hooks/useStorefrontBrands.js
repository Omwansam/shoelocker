import { useContext } from 'react';
import { StorefrontBrandsContext } from '../context/StorefrontBrandsContext.jsx';

export function useStorefrontBrands() {
  const ctx = useContext(StorefrontBrandsContext);
  if (!ctx) {
    throw new Error('useStorefrontBrands must be used within StorefrontBrandsProvider');
  }
  return ctx;
}
