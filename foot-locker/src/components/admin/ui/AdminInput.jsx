/** @param {{ label?: string, className?: string, error?: string } & import('react').InputHTMLAttributes<HTMLInputElement>} props */
export function AdminInput({ label, className = '', id, error, ...rest }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          {label}
        </label>
      ) : null}
      {error ? (
        <p className={`text-xs font-medium text-red-600 ${label ? 'mt-1.5' : ''}`}>{error}</p>
      ) : null}
      <input
        id={inputId}
        className={`${label || error ? 'mt-2 ' : ''}w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-neutral-200 focus:border-neutral-400 focus:ring-neutral-950/10'
        }`}
        {...rest}
      />
    </div>
  );
}
