import { useContext } from 'react';
import { WishlistContext } from '../context/wishlistContext.js';

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
