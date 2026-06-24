import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar.jsx';
import { fetchStores } from '../utils/api.js';

export function StoreLocator() {
  const [query, setQuery] = useState('');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    fetchStores({ signal: ac.signal })
      .then((list) => setStores(list))
      .catch((e) => {
        if (e?.code === 'ERR_CANCELED') return;
        setError('Could not load store branches. Please try again.');
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) => {
      const blob = `${s.name} ${s.street} ${s.city} ${s.county} ${s.postcode ?? ''} ${s.phone ?? ''}`;
      return blob.toLowerCase().includes(q);
    });
  }, [query, stores]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <nav className="text-sm text-neutral-600">
        <Link to="/" className="hover:text-neutral-950">
          Home
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span className="text-neutral-950">Stores — Kenya</span>
      </nav>
      <h1 className="mt-6 text-pretty font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] sm:text-4xl">
        ShoeLocker Kenya — Find a branch
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Search by town, county, postal code, or mall name. Same-day pickup
        available in Nairobi on select pairs when stock allows.
      </p>

      <div className="mt-10 max-w-xl">
        <SearchBar
          value={query}
          onChange={setQuery}
          id="store-search"
          placeholder="Nairobi, Mombasa, 00619, Two Rivers…"
        />
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="h-52 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
            />
          ))
        ) : error ? (
          <li className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
            {error}
          </li>
        ) : filtered.length === 0 ? (
          <li className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
            {query
              ? `Hakuna branches matching “${query}”. Try another town or estate.`
              : 'No branches are listed yet. Check back soon.'}
          </li>
        ) : (
          filtered.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                {s.county} County
              </p>
              <h2 className="mt-1 font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed]">
                {s.name}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                {s.street}
                <br />
                {s.city} {s.postcode}
              </p>
              {s.opening_hours ? (
                <p className="mt-2 text-xs text-neutral-500">{s.opening_hours}</p>
              ) : null}
              {s.phone ? (
                <a
                  href={`tel:${s.phone.replace(/\s/g, '')}`}
                  className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline"
                >
                  {s.phone}
                </a>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {s.pickup_available ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-green-800">
                    Pickup available
                  </span>
                ) : null}
                <Link
                  to="/shop"
                  className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-neutral-800"
                >
                  Browse online catalog
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
