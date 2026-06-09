import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { Filters } from '../components/Filters.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { SearchBar } from '../components/SearchBar.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useProducts } from '../hooks/useProducts.js';
import { SALE_MAX_KES } from '../config/market.js';
import { PRODUCT_TYPES } from '../config/productTypes.js';
import { formatPrice } from '../utils/format.js';
import { priceBracketMatch } from '../utils/catalogFilters.js';

/** @typedef {import('../components/Filters.jsx').FilterState} FilterState */
/** @typedef {import('../components/Filters.jsx').SortBy} SortBy */

const VALID_CATEGORIES = /** @type {const} */ (['men', 'women', 'kids']);
const VALID_TYPES = /** @type {const} */ (['shoes', 'apparel', 'accessories']);

const defaultFilters = /** @type {FilterState} */ ({
  brand: 'all',
  size: 'all',
  category: 'all',
  price: 'any',
});

export function Shop() {
  const navigate = useNavigate();
  const location = useLocation();
  const onSaleRoute = location.pathname === '/sale';
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('category') ?? 'all';
  const typeParam = searchParams.get('type') ?? (onSaleRoute ? 'all' : 'shoes');
  const sortParam = searchParams.get('sort');

  /** @type {SortBy | null} */
  const initialSort =
    sortParam === 'newest'
      ? 'newest'
      : sortParam === 'price-asc'
        ? 'price-asc'
        : sortParam === 'price-desc'
          ? 'price-desc'
          : null;

  const urlCategory =
    catParam !== 'all' && VALID_CATEGORIES.includes(catParam)
      ? catParam
      : null;

  const productType = onSaleRoute
    ? 'all'
    : typeParam !== 'all' && VALID_TYPES.includes(typeParam)
      ? typeParam
      : 'shoes';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 240);
  const [storedFilters, setStoredFilters] = useState({ ...defaultFilters });

  const [sortBy, setSortBy] = useState(
    /** @type {SortBy} */ (initialSort ?? 'featured'),
  );

  const { products, loading, error, refetch } = useProducts({ delayMs: 360 });

  const brandsInCatalog = useMemo(() => {
    const s = new Set(products.map((p) => p.brand));
    return [...s];
  }, [products]);

  const brandQuery = searchParams.get('brand');

  const urlBrand = useMemo(() => {
    if (!brandQuery) return null;
    const decoded = decodeURIComponent(brandQuery).trim();
    return (
      brandsInCatalog.find(
        (b) => b.toLowerCase() === decoded.toLowerCase(),
      ) ?? null
    );
  }, [brandQuery, brandsInCatalog]);

  const sizesInCatalog = useMemo(() => {
    const s = new Set(products.flatMap((p) => p.sizes));
    return [...s];
  }, [products]);

  const filters = useMemo(
    () => ({
      ...storedFilters,
      category: urlCategory ?? storedFilters.category,
      brand: urlBrand ?? storedFilters.brand,
      price: onSaleRoute ? /** @type {'sale'} */ ('sale') : storedFilters.price,
    }),
    [storedFilters, urlCategory, urlBrand, onSaleRoute],
  );

  const brandLocked = Boolean(urlBrand);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = products.filter((p) => {
      const pType = p.productType || PRODUCT_TYPES.SHOES;
      if (productType !== 'all' && pType !== productType) return false;
      if (
        filters.brand !== 'all' &&
        p.brand !== filters.brand
      )
        return false;
      if (
        filters.category !== 'all' &&
        p.category !== filters.category
      )
        return false;
      if (filters.size !== 'all' && !p.sizes.includes(filters.size))
        return false;
      if (!priceBracketMatch(filters.price, p.price)) return false;
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
  }, [debouncedSearch, filters, sortBy, products, productType]);

  const pageTitle = onSaleRoute
    ? 'Sale'
    : urlBrand
      ? `Shop ${urlBrand}`
      : productType === PRODUCT_TYPES.APPAREL
        ? 'Shop apparel'
        : 'Shop all shoes';

  const pageDesc = onSaleRoute
    ? `Sale wall: every style is ${formatPrice(SALE_MAX_KES)} or less — grab your Kenyan size.`
    : productType === PRODUCT_TYPES.APPAREL
      ? 'Hoodies, tees, shorts, and jackets — filter by brand, size, and gender.'
      : 'Every price is in Kenyan Shillings — filter by brand, size, and category for your city run.';

  function patchFilters(/** @type {Partial<FilterState>} */ patch) {
    setStoredFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 animate-fade-rise">
        <h1 className="text-pretty text-3xl font-[800] uppercase tracking-tight text-black [font-stretch:condensed] sm:text-4xl">
          {pageTitle}
        </h1>
        <p className="mt-2 max-w-xl text-neutral-600">
          {pageDesc}
        </p>
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
          priceLockedSale={onSaleRoute}
          brandLocked={brandLocked}
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
          title="No matches"
          description="Try loosening filters or searching for a different brand or silhouette."
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
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4-4" />
            </svg>
          }
        >
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStoredFilters({ ...defaultFilters });
              setSortBy('featured');
              navigate('/shop', { replace: true });
            }}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Reset filters
          </button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showSaleSticker={filters.price === 'sale'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
