const tones = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

/** @param {{ tone?: keyof typeof tones, children: import('react').ReactNode, className?: string }} props */
export function AdminAlert({ tone = 'error', children, className = '' }) {
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]} ${className}`}>
      {children}
    </p>
  );
}
