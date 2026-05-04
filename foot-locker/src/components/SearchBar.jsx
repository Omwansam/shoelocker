/**
 * Search bar with rounded full-width framing (sticky shop filter).
 *
 * @param {{
 *   value: string,
 *   onChange: (next: string) => void,
 *   id?: string,
 *   placeholder?: string,
 * }} props
 */
export function SearchBar({
  value,
  onChange,
  id = 'shop-search',
  placeholder = 'Search sneakers, brands…',
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
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
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-black shadow-sm outline-none ring-black/5 transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-black/10"
      />
    </div>
  );
}
