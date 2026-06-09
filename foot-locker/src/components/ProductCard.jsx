import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { formatPrice } from '../utils/format.js';

/**
 * @typedef {import('../data/products.js').products extends (infer P)[] ? P : never} Product
 */

/** @param {{ product: Product, className?: string, showSaleSticker?: boolean }} props */
export function ProductCard({
  product,
  className = '',
  showSaleSticker = false,
}) {
  const { addItem, openDrawer } = useCart();
  const { show: showToast } = useToast();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [swap, setSwap] = useState(false);
  const labelId = useId();

  function handleAdd(e) {
    e.preventDefault();
    if (!product.sizes.includes(size)) return;
    addItem(product, size, 1);
    openDrawer();
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    const on = has(product.id);
    toggle(product.id, product.product_id);
    showToast(on ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
  }

  const heroSrc = swap && product.hoverImage ? product.hoverImage : product.image;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-2 top-2 z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label={has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={has(product.id)}
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
        </button>
        <Link
          to={`/product/${product.id}`}
          className="relative block h-full outline-none"
          aria-describedby={labelId}
        >
          <img
          src={heroSrc}
          alt={`${product.brand} ${product.name}`}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
          onMouseEnter={() => product.hoverImage && setSwap(true)}
          onMouseLeave={() => setSwap(false)}
          onFocus={() => product.hoverImage && setSwap(true)}
          onBlur={() => setSwap(false)}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {(showSaleSticker || product.isNew) ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {showSaleSticker ? (
              <span className="rounded bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                Sale
              </span>
            ) : null}
            {product.isNew ? (
              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            ) : null}
          </div>
        ) : null}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-h-0">
          <p
            id={labelId}
            className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {product.brand}
          </p>
          <Link to={`/product/${product.id}`}>
            <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-black transition group-hover:text-brand-red">
              {product.name}
            </h3>
          </Link>
          <p className="mt-2 text-lg font-semibold tracking-tight text-black">
            {formatPrice(product.price)}
          </p>
        </div>

        <form className="mt-auto flex flex-col gap-2" onSubmit={handleAdd}>
          <label htmlFor={`size-${product.id}`} className="sr-only">
            Size for {product.name}
          </label>
          <select
            id={`size-${product.id}`}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-neutral-300"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Add to cart
          </button>
        </form>
      </div>
    </article>
  );
}
