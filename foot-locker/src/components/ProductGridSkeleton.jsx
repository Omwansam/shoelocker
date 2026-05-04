/** @param {{ count?: number }} props */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-neutral-100 bg-white"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-3 w-20 rounded-full bg-neutral-200" />
            <div className="h-4 w-[72%] max-w-[14rem] rounded-full bg-neutral-200" />
            <div className="h-5 w-24 rounded-full bg-neutral-200" />
            <div className="h-10 rounded-xl bg-neutral-200" />
            <div className="h-10 rounded-xl bg-neutral-900/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
