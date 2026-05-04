/**
 * Marketing-friendly empty placeholder for grids and carts.
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   children?: React.ReactNode,
 *   icon?: React.ReactNode,
 * }} props
 */
export function EmptyState({ title, description, children, icon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
