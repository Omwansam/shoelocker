import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useWishlist } from '../hooks/useWishlist.js';
import { fetchProducts } from '../utils/api.js';
import { isLoggedIn } from '../utils/auth.js';

export function WishlistPage() {
  const { ids, products: apiProducts } = useWishlist();
  const [guestProducts, setGuestProducts] = useState(/** @type {any[]} */ ([]));
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (loggedIn || !ids.length) {
      setGuestProducts([]);
      return;
    }
    const ac = new AbortController();
    fetchProducts({ signal: ac.signal, throwOnError: true })
      .then((all) => setGuestProducts(all.filter((p) => ids.includes(p.id))))
      .catch(() => setGuestProducts([]));
    return () => ac.abort();
  }, [loggedIn, ids]);

  const products = loggedIn ? apiProducts : guestProducts;

  if (!ids.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Your wishlist is empty"
          description="Save pairs you love — tap the heart on any product card or details page."
        >
          <Link
            to="/shop"
            className="inline-flex rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Browse the wall
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Wishlist</h1>
      <p className="mt-2 text-neutral-600">
        {products.length} saved pair{products.length === 1 ? '' : 's'}
        {loggedIn ? ' — synced to your account.' : ' — stored on this device.'}
      </p>
      {products.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">
          Loading saved products from the catalog…
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
