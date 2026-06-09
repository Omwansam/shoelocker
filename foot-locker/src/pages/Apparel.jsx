import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { Filters } from '../components/Filters.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import {
  APPAREL_STYLES,
  PRODUCT_TYPES,
  matchesApparelStyle,
} from '../config/productTypes.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useProducts } from '../hooks/useProducts.js';
import { priceBracketMatch } from '../utils/catalogFilters.js';

/** @typedef {import('../components/Filters.jsx').FilterState} FilterState */
/** @typedef {import('../components/Filters.jsx').SortBy} SortBy */

const VALID_CATEGORIES = /** @type {const} */ (['men', 'women', 'kids']);

const defaultFilters = /** @type {FilterState} */ ({
  brand: 'all',
  size: 'all',
  category: 'all',
  price: 'any',
});

const spotlightCards = [
  {
    style: 'hoodies',
    title: 'Hoodies & fleece',
    copy: 'Layer up for cool Nairobi mornings.',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
  },
  {
    style: 'tees',
    title: 'Everyday tees',
    copy: 'Rotation-ready cotton staples.',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    style: 'shorts',
    title: 'Shorts & joggers',
    copy: 'Track days to weekend errands.',
    img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
  },
  {
    style: 'jackets',
    title: 'Jackets & outerwear',
    copy: 'Wind-ready shells and lightweight layers.',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80',
  },
];

export function Apparel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const styleParam = searchParams.get('style') ?? 'all';
  const catParam = searchParams.get('category') ?? 'all';

  const urlCategory =
    catParam !== 'all' && VALID_CATEGORIES.includes(catParam) ? catParam : null;

  const activeStyle = APPAREL_STYLES.some((s) => s.id === styleParam)
    ? styleParam
    : 'all';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 240);
  const [storedFilters, setStoredFilters] = useState({ ...defaultFilters });
  const [sortBy, setSortBy] = useState(/** @type {SortBy} */ ('featured'));

  const { products, loading, error, refetch } = useProducts({ delayMs: 360 });

  const apparelProducts = useMemo(
    () => products.filter((p) => p.productType === PRODUCT_TYPES.APPAREL),
    [products],
  );

  const brandsInCatalog = useMemo(() => {
    const s = new Set(apparelProducts.map((p) => p.brand));
    return [...s];
  }, [apparelProducts]);

  const sizesInCatalog = useMemo(() => {
    const s = new Set(apparelProducts.flatMap((p) => p.sizes));
    return [...s];
  }, [apparelProducts]);

  const filters = useMemo(
    () => ({
      ...storedFilters,
      category: urlCategory ?? storedFilters.category,
    }),
    [storedFilters, urlCategory],
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = apparelProducts.filter((p) => {
      if (filters.brand !== 'all' && p.brand !== filters.brand) return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.size !== 'all' && !p.sizes.includes(filters.size)) return false;
      if (!priceBracketMatch(filters.price, p.price)) return false;
      if (!matchesApparelStyle(p, activeStyle)) return false;
      if (q) {
        const blob = `${p.name} ${p.brand}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    const next = [...list];
    switch (sortBy) {
      case 'price-asc':
        next.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        next.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        next.sort((a, b) => Number(b.isNew) - Number(a.isNew));
        break;
      default:
        next.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }
    return next;
  }, [debouncedSearch, filters, sortBy, apparelProducts, activeStyle]);

  function patchFilters(/** @type {Partial<FilterState>} */ patch) {
    setStoredFilters((prev) => ({ ...prev, ...patch }));
  }

  function setStyle(styleId) {
    const next = new URLSearchParams(searchParams);
    if (styleId === 'all') next.delete('style');
    else next.set('style', styleId);
    setSearchParams(next, { replace: true });
  }

  function setGender(category) {
    const next = new URLSearchParams(searchParams);
    if (category === 'all') next.delete('category');
    else next.set('category', category);
    setSearchParams(next, { replace: true });
  }

  const styleLabel =
    APPAREL_STYLES.find((s) => s.id === activeStyle)?.label ?? 'All apparel';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <img
          src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-red">
              Clothing &amp; gear
            </p>
            <h1 className="mt-3 text-pretty text-4xl font-[800] uppercase leading-none tracking-tighter [font-stretch:condensed] sm:text-5xl lg:text-6xl">
              Apparel
            </h1>
            <p className="mt-4 max-w-md text-base text-neutral-300 sm:text-lg">
              Hoodies, tees, shorts, and jackets from the brands you already
              trust — sized S–XXL and priced in Kenyan Shillings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="inline-flex border border-white/30 px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-neutral-950"
              >
                Shop shoes
              </Link>
              <Link
                to="/releases"
                className="inline-flex bg-brand-red px-5 py-2.5 text-[12px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-red-hover"
              >
                New arrivals
              </Link>
            </div>
          </div>
          <div className="hidden gap-6 lg:flex">
            {[
              ['8+', 'Styles'],
              ['S–XXL', 'Sizing'],
              ['KES', 'Local pricing'],
            ].map(([val, label]) => (
              <div
                key={label}
                className="border border-white/20 bg-white/5 px-6 py-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-[800] tabular-nums [font-stretch:condensed]">
                  {val}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style spotlight */}
      <section
        aria-label="Shop by style"
        className="border-b border-neutral-200 bg-neutral-50"
      >
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-[800] uppercase tracking-tighter [font-stretch:condensed] sm:text-2xl">
                Shop by style
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Tap a category to filter the wall below.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {spotlightCards.map((card) => (
              <button
                key={card.style}
                type="button"
                onClick={() => setStyle(card.style)}
                className={`group relative overflow-hidden border text-left transition ${
                  activeStyle === card.style
                    ? 'border-neutral-950 ring-2 ring-neutral-950/10'
                    : 'border-neutral-200 hover:border-neutral-950'
                }`}
              >
                <img
                  src={card.img}
                  alt=""
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <p className="text-sm font-[800] uppercase [font-stretch:condensed] sm:text-base">
                    {card.title}
                  </p>
                  <p className="mt-0.5 hidden text-xs text-neutral-300 sm:block">
                    {card.copy}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-[800] uppercase tracking-tighter [font-stretch:condensed] sm:text-3xl">
              {styleLabel}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {!loading && filtered.length > 0
                ? `${filtered.length} piece${filtered.length === 1 ? '' : 's'} in stock`
                : 'Filter by gender, brand, or size'}
            </p>
          </div>

          {/* Gender tabs */}
          <div
            className="flex flex-wrap gap-1 rounded-full border border-neutral-200 bg-white p-1"
            role="tablist"
            aria-label="Gender filter"
          >
            {[
              ['all', 'All'],
              ['men', "Men's"],
              ['women', "Women's"],
              ['kids', "Kids'"],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                role="tab"
                aria-selected={(urlCategory ?? 'all') === val}
                onClick={() => setGender(val)}
                className={`rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                  (urlCategory ?? 'all') === val
                    ? 'bg-neutral-950 text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Style chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {APPAREL_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide transition ${
                activeStyle === s.id
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-950'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <Filters
            brandsInCatalog={brandsInCatalog}
            sizesInCatalog={sizesInCatalog}
            filters={filters}
            onFiltersChange={patchFilters}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sizeLabel="Size"
            categoryLabel="Gender"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-2 font-medium text-brand-red underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No apparel matches"
            description="Try a different style, loosen your filters, or browse our full shoe catalog."
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
            }
          >
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStoredFilters({ ...defaultFilters });
                setSortBy('featured');
                navigate('/apparel', { replace: true });
              }}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
            >
              Reset filters
            </button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
