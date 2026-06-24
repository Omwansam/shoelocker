import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useProductSearch } from '../hooks/useProductSearch.js';
import { formatPrice } from '../utils/format.js';
import { productDisplayImage } from '../utils/productImages.js';

/**
 * Shared navbar / mobile search with live suggestions.
 * @param {{ className?: string, onSubmitted?: () => void, autoFocus?: boolean }} props
 */
export function NavSearchForm({ className = '', onSubmitted, autoFocus = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const listId = useId();
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 260);

  const { products, loading } = useProductSearch(debounced, {
    enabled: open && debounced.trim().length >= 2,
    limit: 6,
    minLength: 2,
  });

  useEffect(() => {
    if (location.pathname === '/search') {
      setQuery(new URLSearchParams(location.search).get('q') ?? '');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function goSearch(/** @type {string} */ value) {
    const trimmed = value.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
    setOpen(false);
    onSubmitted?.();
  }

  const showSuggestions =
    open && debounced.trim().length >= 2 && (loading || products.length > 0);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch(query);
        }}
      >
        <label htmlFor="nav-site-search" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4-4" />
            </svg>
          </span>
          <input
            ref={inputRef}
            id="nav-site-search"
            name="q"
            type="search"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="search"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? listId : undefined}
            aria-autocomplete="list"
            placeholder="Search brands, styles…"
            className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-3 text-sm text-neutral-900 shadow-inner outline-none transition placeholder:text-neutral-400 focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </form>

      {showSuggestions ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-neutral-500">Searching…</p>
          ) : (
            <ul className="max-h-[min(24rem,70vh)] overflow-y-auto py-1">
              {products.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.id}`}
                    role="option"
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-neutral-50"
                    onClick={() => {
                      setOpen(false);
                      onSubmitted?.();
                    }}
                  >
                    <img
                      src={productDisplayImage(p.image)}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-lg border border-neutral-100 bg-neutral-50 object-contain p-1"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-neutral-900">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">
                        {p.brand} · {formatPrice(p.price)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="w-full border-t border-neutral-100 px-4 py-2.5 text-left text-[12px] font-bold uppercase tracking-wide text-brand-red transition hover:bg-neutral-50"
            onClick={() => goSearch(debounced)}
          >
            View all results for “{debounced.trim()}”
          </button>
        </div>
      ) : null}
    </div>
  );
}
