import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { formatPrice } from '../utils/format.js';
import { FALLBACK_PRODUCT_IMAGE, productDisplayImage } from '../utils/productImages.js';

/**
 * Compact portrait card for the horizontal Popular right now rail.
 * @param {{ product: any, index?: number, className?: string }} props
 */
export function PopularRailCard({ product, index, className = '' }) {
  const { addItem, openDrawer } = useCart();
  const { show: showToast } = useToast();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [imgSrc, setImgSrc] = useState(() => productDisplayImage(product.image));
  const labelId = useId();
  const orderCount = product.order_count || 0;

  function handleAdd(e) {
    e.preventDefault();
    if (!product.sizes.includes(size)) return;
    addItem(product, size, 1);
    openDrawer();
    showToast('Added to cart', 'success');
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    const on = has(product.id);
    toggle(product.id, product.product_id);
    showToast(on ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
  }

  function handleImageSwap(on) {
    setImgSrc(
      productDisplayImage(on && product.hoverImage ? product.hoverImage : product.image),
    );
  }

  return (
    <article
      className={`group flex h-full w-[72vw] max-w-[270px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/95 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_48px_-12px_rgb(0_0_0_/_0.7)] sm:w-[42vw] lg:w-full lg:max-w-none lg:shrink ${className}`}
    >
      <div className="relative aspect-[4/5] max-h-[300px] overflow-hidden bg-neutral-800">
        {index != null ? (
          <span className="absolute left-2.5 top-2.5 z-[2] rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            #{index + 1}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 z-[2] flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
          aria-label={has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={has(product.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={has(product.id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className={has(product.id) ? 'text-brand-red' : 'text-white'}
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <Link
          to={`/product/${product.id}`}
          className="relative block h-full outline-none"
          aria-describedby={labelId}
          onMouseEnter={() => product.hoverImage && handleImageSwap(true)}
          onMouseLeave={() => handleImageSwap(false)}
        >
          <img
            src={imgSrc}
            alt={`${product.brand} ${product.name}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(FALLBACK_PRODUCT_IMAGE)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/65">
            {product.brand}
          </p>
          <h3
            id={labelId}
            className="mt-0.5 line-clamp-2 text-sm font-[800] uppercase leading-tight tracking-tight text-white [font-stretch:condensed]"
          >
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-base font-bold text-white">{formatPrice(product.price)}</p>
            {orderCount > 0 ? (
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">
                {orderCount} sold
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <form
        className="flex flex-col gap-2 border-t border-white/10 bg-neutral-950 p-2.5"
        onSubmit={handleAdd}
      >
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-xs font-medium text-white"
          aria-label={`Size for ${product.name}`}
        >
          {product.sizes.map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-lg bg-brand-red text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
        >
          Add to cart
        </button>
      </form>
    </article>
  );
}

/** @deprecated Use PopularRailCard — kept for import compatibility */
export const PopularZigzagCard = PopularRailCard;
