/** @param {{ title?: string, subtitle?: string, action?: import('react').ReactNode, children: import('react').ReactNode, className?: string, padding?: boolean }} props */
export function AdminCard({ title, subtitle, action, children, className = '', padding = true }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgb(0_0_0/0.04),0_8px_24px_-8px_rgb(0_0_0/0.08)] ${className}`}>
      {title ? (
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </section>
  );
}
