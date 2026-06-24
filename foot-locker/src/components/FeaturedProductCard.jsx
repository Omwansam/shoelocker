import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { formatPrice } from '../utils/format.js';
import { FALLBACK_PRODUCT_IMAGE, productDisplayImage } from '../utils/productImages.js';

/**
 * Featured shoe card for the homepage wall — sized between compact and full catalog cards.
 * @param {{ product: any, slot?: number, className?: string }} props
 */
export function FeaturedProductCard({ product, slot, className = '' }) {
  const { addItem, openDrawer } = useCart();
  const { show: showToast } = useToast();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [imgSrc, setImgSrc] = useState(() => productDisplayImage(product.image));
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

  function handleImageSwap(on) {
    setImgSrc(
      productDisplayImage(on && product.hoverImage ? product.hoverImage : product.image),
    );
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[var(--shadow-card-hover)] ${className}`}
    >
      {slot != null ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-3 z-[2] font-[800] text-[11px] uppercase tracking-[0.22em] text-neutral-300 [font-stretch:condensed]"
        >
          {String(slot).padStart(2, '0')}
        </span>
      ) : null}

      <div className="relative aspect-[4/5] max-h-[255px] overflow-hidden bg-neutral-100 sm:max-h-[275px] lg:max-h-[295px]">
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 z-[2] flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white sm:h-9 sm:w-9"
          aria-label={has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={has(product.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={has(product.id) ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className={has(product.id) ? 'text-brand-red' : 'text-neutral-600'}
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
          onFocus={() => product.hoverImage && handleImageSwap(true)}
          onBlur={() => handleImageSwap(false)}
        >
          <img
            src={imgSrc}
            alt={`${product.brand} ${product.name}`}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(FALLBACK_PRODUCT_IMAGE)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.isNew ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              New
            </span>
          ) : null}
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
        <div className="min-h-0">
          <p
            id={labelId}
            className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {product.brand}
          </p>
          <Link to={`/product/${product.id}`}>
            <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-neutral-950 transition group-hover:text-brand-red">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-base font-bold tracking-tight text-neutral-950">
            {formatPrice(product.price)}
          </p>
        </div>

        <form className="mt-auto flex flex-col gap-1.5" onSubmit={handleAdd}>
          <label htmlFor={`featured-size-${product.id}`} className="sr-only">
            Size for {product.name}
          </label>
          <select
            id={`featured-size-${product.id}`}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:border-neutral-300"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-neutral-950 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red"
          >
            Add to cart
          </button>
        </form>
      </div>
    </article>
  );
}
