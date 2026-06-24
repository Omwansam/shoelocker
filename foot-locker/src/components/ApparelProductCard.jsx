import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { formatPrice } from '../utils/format.js';
import { FALLBACK_PRODUCT_IMAGE, productDisplayImage } from '../utils/productImages.js';

/**
 * Editorial product card for the Fresh apparel homepage section.
 * @param {{ product: any, className?: string }} props
 */
export function ApparelProductCard({ product, className = '' }) {
  const { addItem, openDrawer } = useCart();
  const { show: showToast } = useToast();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState(product.sizes[0] ?? '');
  const [imgSrc, setImgSrc] = useState(() => productDisplayImage(product.image));
  const labelId = useId();

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
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
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_50px_-12px_rgb(0_0_0_/_0.65)] ${className}`}
    >
      <div className="relative h-[437px] w-full overflow-hidden bg-neutral-800 sm:h-[451px] lg:h-[504px]">
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          aria-label={has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={has(product.id)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="17"
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
          onFocus={() => product.hoverImage && handleImageSwap(true)}
          onBlur={() => handleImageSwap(false)}
        >
          <img
            src={imgSrc}
            alt={`${product.brand} ${product.name}`}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(FALLBACK_PRODUCT_IMAGE)}
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90 transition group-hover:opacity-100"
            aria-hidden
          />
          {product.isNew ? (
            <span className="absolute left-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white shadow-md">
              New drop
            </span>
          ) : null}
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {product.brand}
          </p>
          <h3
            id={labelId}
            className="mt-0.5 line-clamp-2 text-sm font-[800] uppercase leading-tight tracking-tight text-white [font-stretch:condensed]"
          >
            {product.name}
          </h3>
          <p className="mt-1.5 text-base font-bold tracking-tight text-white">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>

      <form
        className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-neutral-950/90 p-3"
        onSubmit={handleAdd}
      >
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {product.sizes.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`min-w-[2rem] shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition ${
                size === s
                  ? 'border-white bg-white text-neutral-950'
                  : 'border-white/20 text-neutral-300 hover:border-white/40 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="flex h-9 items-center justify-center rounded-lg bg-brand-red text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-red-hover"
        >
          Add to cart
        </button>
      </form>
    </article>
  );
}
