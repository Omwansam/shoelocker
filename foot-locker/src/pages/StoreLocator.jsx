import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar.jsx';

const STORES = [
  {
    id: '1',
    name: 'ShoeLocker Two Rivers',
    street: 'Two Rivers Mall, Limuru Road',
    city: 'Nairobi',
    county: 'Nairobi',
    postcode: '00619',
    phone: '+254 722 555 014',
  },
  {
    id: '2',
    name: 'ShoeLocker Sarit Centre',
    street: 'Sarit Centre, Westlands',
    city: 'Nairobi',
    county: 'Nairobi',
    postcode: '00623',
    phone: '+254 733 555 018',
  },
  {
    id: '3',
    name: 'ShoeLocker Nyali',
    street: 'Nyali Road, near City Mall',
    city: 'Mombasa',
    county: 'Mombasa',
    postcode: '80100',
    phone: '+254 711 555 021',
  },
  {
    id: '4',
    name: 'ShoeLocker Mega City',
    street: 'Mega City Mall, Oginga Odinga Rd',
    city: 'Kisumu',
    county: 'Kisumu',
    postcode: '40100',
    phone: '+254 725 555 009',
  },
  {
    id: '5',
    name: 'ShoeLocker Nakuru Westside',
    street: 'Westside Mall, Kenyatta Ave',
    city: 'Nakuru',
    county: 'Nakuru',
    postcode: '20100',
    phone: '+254 700 555 033',
  },
];

export function StoreLocator() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STORES;
    return STORES.filter((s) => {
      const blob = `${s.name} ${s.street} ${s.city} ${s.county} ${s.postcode} ${s.phone}`;
      return blob.toLowerCase().includes(q);
    });
  }, [query]);

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
        {filtered.length === 0 ? (
          <li className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center text-neutral-600">
            Hakuna branches matching &ldquo;{query}&rdquo;. Try another town or estate.
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
              <a
                href={`tel:${s.phone.replace(/\s/g, '')}`}
                className="mt-4 inline-block text-sm font-semibold text-brand-red hover:underline"
              >
                {s.phone}
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
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
