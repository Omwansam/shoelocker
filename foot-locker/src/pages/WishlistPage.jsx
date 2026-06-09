import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { mergeCatalogList } from '../utils/catalogStorage.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { isLoggedIn } from '../utils/auth.js';

export function WishlistPage() {
  const { ids, products: apiProducts } = useWishlist();

  const products = isLoggedIn() && apiProducts.length
    ? apiProducts
    : ids
        .map((id) => mergeCatalogList().find((p) => p.id === id))
        .filter((p) => p != null);

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
        {isLoggedIn() ? ' — synced to your account.' : ' — stored on this device.'}
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
