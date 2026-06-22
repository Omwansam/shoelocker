const variants = {
  primary: 'bg-brand-red text-white hover:bg-brand-red-hover shadow-sm shadow-brand-red/20',
  secondary: 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300',
  dark: 'bg-neutral-950 text-white hover:bg-neutral-800',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
};

/** @param {{ variant?: keyof typeof variants, children: import('react').ReactNode, className?: string } & import('react').ButtonHTMLAttributes<HTMLButtonElement>} props */
export function AdminButton({ variant = 'secondary', children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** @param {{ variant?: keyof typeof variants, children: import('react').ReactNode, className?: string } & import('react').AnchorHTMLAttributes<HTMLAnchorElement>} props */
export function AdminLinkButton({ variant = 'primary', children, className = '', ...rest }) {
  return (
    <a
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold no-underline transition ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
