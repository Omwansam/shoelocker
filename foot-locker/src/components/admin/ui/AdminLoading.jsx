/** @param {{ label?: string, minHeight?: string }} props */
export function AdminLoading({ label = 'Loading…', minHeight = 'min-h-[280px]' }) {
  return (
    <div className={`flex ${minHeight} flex-col items-center justify-center gap-4`}>
      <div className="relative">
        <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-neutral-200 border-t-brand-red" />
      </div>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
    </div>
  );
}
