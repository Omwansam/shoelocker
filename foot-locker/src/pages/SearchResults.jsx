import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ProductGridSkeleton.jsx';
import { useProductSearch } from '../hooks/useProductSearch.js';

const POPULAR = ['Nike', 'adidas', 'Puma', 'running', 'Air Max', 'hoodie'];

export function SearchResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const urlQuery = (params.get('q') ?? '').trim();
  const [draft, setDraft] = useState(urlQuery);

  useEffect(() => {
    setDraft(urlQuery);
  }, [urlQuery]);

  const { products, loading, error } = useProductSearch(urlQuery, {
    enabled: urlQuery.length > 0,
    minLength: 1,
    limit: 60,
  });

  function submit(e) {
    e.preventDefault();
    const q = draft.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-red">
        Find your pair
      </p>
      <h1 className="mt-2 font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-3xl">
        Search
      </h1>

      <form
        className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row"
        role="search"
        onSubmit={submit}
      >
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <input
          id="site-search"
          name="q"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Brand, style, silhouette, size…"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm shadow-sm outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-black/10"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-black px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-neutral-900"
        >
          Search
        </button>
      </form>

      {!urlQuery ? (
        <div className="mt-8">
          <p className="text-sm text-neutral-600">
            Try a brand, model name, or category — e.g. Nike, Ultraboost, or
            men&apos;s running.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR.map((term) => (
              <Link
                key={term}
                to={`/search?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-800 transition hover:border-neutral-950"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      {urlQuery && loading ? (
        <div className="mt-10">
          <ProductGridSkeleton count={8} />
        </div>
      ) : null}

      {urlQuery && !loading ? (
        <>
          <p className="mt-6 text-sm text-neutral-600">
            Found {products.length} result{products.length === 1 ? '' : 's'} for
            &ldquo;{urlQuery}&rdquo;
          </p>

          {products.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches"
              description="Try a different brand, model, or spelling — or browse the full catalog."
            >
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/shop"
                  className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
                >
                  Shop all
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDraft('');
                    navigate('/search');
                  }}
                  className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950"
                >
                  Clear search
                </button>
              </div>
            </EmptyState>
          )}
        </>
      ) : null}
    </div>
  );
}
