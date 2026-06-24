import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { ProductReviews } from '../components/ProductReviews.jsx';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { sizeLabelForType } from '../config/productTypes.js';
import { formatPrice } from '../utils/format.js';
import { FALLBACK_PRODUCT_IMAGE, productDisplayImage } from '../utils/productImages.js';

/**
 * @typedef {import('../types/product.js').Product} Product
 */

/** @param {{ product: Product }} props */
function ProductMedia({ product }) {
  const rawGallery = product.gallery?.length ? product.gallery : [product.image];
  const gallery = rawGallery.map((src) => productDisplayImage(src)).filter(Boolean);
  const images = gallery.length ? gallery : [FALLBACK_PRODUCT_IMAGE];
  const [activeIdx, setActiveIdx] = useState(0);
  const [heroSrc, setHeroSrc] = useState(images[0]);
  const hero = images[Math.min(activeIdx, images.length - 1)];

  useEffect(() => {
    setHeroSrc(hero);
  }, [hero]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-[var(--shadow-card)]">
        <img
          src={heroSrc}
          alt={`${product.brand} ${product.name}`}
          className="aspect-square w-full object-cover transition duration-500"
          decoding="async"
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={() => setHeroSrc(FALLBACK_PRODUCT_IMAGE)}
        />
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Product gallery"
      >
        {images.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            type="button"
            role="tab"
            aria-selected={idx === activeIdx}
            aria-label={`View image ${idx + 1}`}
            onClick={() => setActiveIdx(idx)}
            className={`shrink-0 overflow-hidden rounded-xl border-2 transition ${
              idx === activeIdx
                ? 'border-black ring-2 ring-black/15'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={src}
              alt=""
              width={88}
              height={88}
              className="h-20 w-20 object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** @param {{ product: Product }} props */
function ProductPurchase({ product }) {
  const { addItem, openDrawer } = useCart();
  const { show } = useToast();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState(product.sizes[0] ?? '');

  function handleAdd(e) {
    e.preventDefault();
    if (!product.sizes.includes(size)) return;
    addItem(product, size, 1);
    openDrawer();
  }

  function handleWishlist() {
    const on = has(product.id);
    toggle(product.id, product.product_id);
    show(on ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleAdd}>
      <div>
        <label
          htmlFor={`pd-size-${product.id}`}
          className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
        >
          {sizeLabelForType(product.productType)}
        </label>
        <select
          id={`pd-size-${product.id}`}
          required
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="mt-2 w-full max-w-xs rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm font-medium shadow-sm outline-none ring-black/0 transition focus:border-black focus:ring-2 focus:ring-black/10"
        >
          {product.sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="h-12 min-w-[200px] rounded-full bg-brand-red px-8 text-sm font-semibold text-white transition hover:bg-brand-red-hover"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          aria-pressed={has(product.id)}
          className="flex h-12 items-center gap-2 rounded-full border border-neutral-300 px-6 text-sm font-semibold text-black transition hover:border-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={has(product.id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className={has(product.id) ? 'text-brand-red' : 'text-neutral-700'}
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {has(product.id) ? 'Saved' : 'Wishlist'}
        </button>
        <Link
          to="/shop"
          className="flex h-12 items-center rounded-full border border-neutral-300 px-8 text-sm font-semibold text-black transition hover:border-black"
        >
          Keep shopping
        </Link>
      </div>
    </form>
  );
}

export function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setProduct(null);
    setRelated([]);

    async function load() {
      try {
        const { fetchProductById, fetchRelatedProducts } = await import('../utils/api.js');
        const prod = await fetchProductById(productId);
        if (!mounted) return;
        setProduct(prod || null);

        if (prod) {
          const relatedItems = await fetchRelatedProducts(prod.product_id || productId);
          if (mounted) setRelated(relatedItems.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    return () => {
      mounted = false;
    };
  }, [productId]);

  if (!product && loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 sm:px-6 lg:px-8">
        <EmptyState
          title="Product not found"
          description="That release may have sold through or moved. Head back to the shop to scout another pair."
        >
          <Link
            to="/shop"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Back to shop
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 text-sm font-medium text-neutral-600 transition hover:text-black"
      >
        ← Back
      </button>

      <div className="grid gap-10 lg:grid-cols-2 animate-fade-rise">
        <ProductMedia key={product.id} product={product} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-red">
            {product.brand}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">
            {product.name}
          </h1>
          <p className="mt-4 text-3xl font-bold">{formatPrice(product.price)}</p>

          <p className="mt-6 leading-relaxed text-neutral-700">
            {product.description}
          </p>

          <ProductPurchase key={product.id} product={product} />

          <ul className="mt-10 grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
            <li>
              • Free standard courier on orders over{` `}
              {formatPrice(settings.free_shipping_threshold)} — {settings.country} mainland
            </li>
            <li>• 100% authentic pairs sourced for the East Africa wall</li>
            <li>• 14-day Nairobi exchange • 30-day nationwide returns*</li>
          </ul>
        </div>
      </div>

      <ProductReviews product={product} />

      {related.length > 0 ? (
        <section className="mt-20 border-t border-neutral-200 pt-14">
          <h2 className="text-2xl font-semibold tracking-tight text-black">
            You might also like
          </h2>
          <p className="mt-1 text-neutral-600">
            More silhouettes from the same category.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
